import json
from io import BytesIO
from PIL import Image
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from backend.models import Notebook


class ViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="12345")
        self.client.login(username="testuser", password="12345")
        response = self.client.get(reverse("index"))
        self.csrf_token = response.context.get("csrf_token")

    def test_index_view(self):
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "main_app.html")
        self.assertIn("notebooks", response.context)

    @patch("requests.get")
    @patch("requests.post")
    @patch("websocket.create_connection")
    def test_execute_python_code(self, mock_ws_conn, mock_post, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.text = json.dumps([])

        mock_post.return_value.status_code = 201
        mock_post.return_value.text = json.dumps({"id": "fake-kernel-id"})

        ws_mock = MagicMock()
        ws_mock.recv.side_effect = [
            json.dumps({"msg_type": "stream", "content": {"text": "Hello"}}),
            json.dumps({"msg_type": "execute_reply"}),
        ]
        mock_ws_conn.return_value = ws_mock

        response = self.client.post(
            reverse("execute"),
            {"language": "python3", "code": "print('Hello')"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNotNone(data["output_stream"][0]["success"])
        self.assertIsNotNone(data["output_stream"][0]["type"])
        self.assertIsNotNone(data["output_stream"][0]["content"])

    @patch("requests.post")
    def test_image_to_text(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "top_preds": [["a", "b", "c"], ["b", "a", "c"]],
            "top_probs": [[0.8, 0.1, 0.1], [0.9, 0.05, 0.05]],
        }

        # Create a fake image with an alpha channel
        img = Image.new("RGBA", (100, 30), (255, 255, 255, 128))
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        response = self.client.post(
            reverse("image_to_text"),  # Replace with actual URL name
            {"model_name": "default", "img": buffer},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["predicted_text"], "ab")

    def test_save_new_notebook(self):
        response = self.client.post(
            reverse("save_notebook"),
            {
                "canvas": "sample canvas",
                "notebook_name": "New Notebook",
                "notebook_id": "-1",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("notebook_id", data)
        self.assertEqual(data["notebooks"][0]["notebook_name"], "New Notebook")

    def test_get_notebook_data(self):
        notebook = Notebook.objects.create(
            user=self.user,
            notebook_name="Django Test Notebook",
            notebook_data="sample data",
        )
        response = self.client.post(
            reverse("get_notebook_data"),
            {"notebook_id": notebook.id},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["notebook_name"], "Django Test Notebook")

    def test_delete_notebook(self):
        nb = Notebook.objects.create(
            user=self.user,
            notebook_name="ToDelete",
            notebook_data="{}",
        )
        response = self.client.post(
            reverse("delete_notebook"),  # Replace with actual URL name
            {"notebook_id": nb.id},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), "success")
