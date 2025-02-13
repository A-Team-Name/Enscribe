from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings

import json
import requests
from websocket import create_connection
from backend.utils import send_execute_request

from PIL import Image

from io import BytesIO


def draw(request: WSGIRequest) -> HttpResponse:
    return render(request, "canvas_drawing.html")


@login_required
def index(request: WSGIRequest) -> HttpResponse:
    return render(request, "main_app.html")


@login_required
def execute(request: WSGIRequest) -> HttpResponse:
    # https://stackoverflow.com/questions/54475896/interact-with-jupyter-notebooks-via-api
    # The token is written on stdout when you start the notebook
    base = f"http://{settings.JUPYTER_URL}:{settings.JUPYTER_PORT}"
    headers = {
        "Authorization": "Token {settings.JUPYTER_TOKEN}",
        "Cookie": request.headers["Cookie"],
        # "X-XSRFToken": request.COOKIES["_xsrf"], # Safe to disable this when using token
    }

    url = base + "/api/kernels"

    # Get execution language from frontend request
    language = request.POST.get("language")

    # Get list of existing kernels
    try:
        response = requests.get(url, headers=headers)
    except requests.exceptions.ConnectionError:
        output = {
            "success": False,
            "type": "text",
            "content": "Jupyter Server Error",
        }
        return JsonResponse({"output_stream": [output]})

    # Single user kernel management
    # Use existing kernel if exists for execution language, otherwise start new kernel
    existing_kernel = False
    if response:
        for kernel in json.loads(response.text):
            if kernel["name"] == language:
                active_kernel = kernel
                existing_kernel = True

    if not existing_kernel:
        response = requests.post(url, headers=headers, json={"name": language})
        active_kernel = json.loads(response.text)

    # Create connection to jupyter kernel
    ws = create_connection(
        f"ws://{settings.JUPYTER_URL}:{settings.JUPYTER_PORT}/api/kernels/{active_kernel['id']}/channels",
        header=headers,
    )

    # Get code from POST request body
    code = request.POST.get("code")

    # Send code to the jupyter kernel
    ws.send(json.dumps(send_execute_request(code)))

    # Process response
    # Collect all the messages which constitute the actual code output
    full_response = []
    while True:
        msg = ws.recv()
        rsp = json.loads(msg)
        msg_type = rsp["msg_type"]

        output = None
        match language:
            case "python3":
                match msg_type:
                    case "stream":
                        output = {
                            "success": True,
                            "type": "text",
                            "content": rsp["content"]["text"],
                        }
                    case "execute_result":
                        output = {
                            "success": True,
                            "type": "text",
                            "content": rsp["content"]["data"]["text/plain"],
                        }
                    case "error":
                        output = {
                            "success": False,
                            "type": "ansi-text",
                            "content": rsp["content"]["traceback"],
                        }
            case "dyalog_apl":
                match msg_type:
                    case "execute_result":
                        output = {
                            "success": True,
                            "type": "html",
                            "content": rsp["content"]["data"]["text/html"],
                        }
                    case "stream":
                        output = {
                            "success": False,
                            "type": "text",
                            "content": rsp["content"]["text"],
                        }
            case "lambda-calculus":
                match msg_type:
                    case "stream":
                        match rsp["content"]["name"]:
                            case "stdout":
                                output = {
                                    "success": True,
                                    "type": "text",
                                    "content": rsp["content"]["text"],
                                }
                            case "stderr":
                                output = {
                                    "success": False,
                                    "type": "text",
                                    "content": rsp["content"]["text"],
                                }

        if output:
            full_response.append(output)
        if msg_type == "execute_reply":
            break

    ws.close()

    return JsonResponse({"output_stream": full_response})
    # return HttpResponse(output)


@login_required
def image_to_text(request):
    if request.method == "POST":
        image = request.FILES["img"]

        img = Image.open(image).convert("L")

        # Save the uploaded image to a temporary file
        temp_image = BytesIO()
        img.save(temp_image, format="PNG")
        temp_image.seek(0)

        # request_url = f"http://{settings.HANDWRITING_URL}:{settings.HANDWRITING_PORT}/translate"

        # files = {"image": temp_image}

        # response = requests.post(request_url, files=files)

        # json_response = response.json()

        json_response = {
            "top_preds": [["a", "b", "c"], ["b", "c", "d"]],
            "top_probs": [[0.5, 0.2, 0.2], [0.8, 0.1, 0.1]],
        }

        top_characters = json_response["top_preds"]
        top_character_probs = json_response["top_probs"]

        code_block_predictions_dict = {}
        code_block_predictions_set = []

        # Loop through each position in string
        for i in range(len(top_characters)):
            top_character_predictions_set = []

            # Loop through top 3 predicted characters for that position
            for j in range(0, 3):
                top_character_predictions_set.append(
                    {
                        "character": top_characters[i][j],
                        "probability": top_character_probs[i][j],
                    }
                )
            code_block_predictions_set.append(top_character_predictions_set)
        code_block_predictions_dict["predictions"] = code_block_predictions_set
        predicted_text = create_predicted_code_block(code_block_predictions_dict)

        return JsonResponse(
            {
                "predicted_text": predicted_text,
                "predictions": code_block_predictions_dict,
            }
        )

    return HttpResponse("upload failed")


# Get the top predicted character for each position and construct a string
def create_predicted_code_block(code_block_prediction_dict):
    predicted_characters_list = []
    all_top_predictions = code_block_prediction_dict["predictions"]

    for character_top_predictions in all_top_predictions:
        # Append the character
        predicted_characters_list.append(character_top_predictions[0]["character"])

    # Construct string from list
    predicted_string = "".join(predicted_characters_list)

    return predicted_string
