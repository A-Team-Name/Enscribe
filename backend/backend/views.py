from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings
from .forms import CustomUserCreationForm
from django.views.generic.edit import CreateView
from django.urls import reverse_lazy

import json
import requests
import numpy as np
from websocket import create_connection
from backend.utils import send_execute_request, strip_html_div
from backend.models import Notebook

from PIL import Image

from io import BytesIO


class RegisterView(CreateView):
    """RegisterView for user registration

    Inherits:
        CreateView: Django's CreateView for creating a new user

    Attributes:
        form_class (CustomUserCreationForm): The form used for user registration
        template_name (str): The template used for rendering the registration page
        success_url (str): The URL to redirect to after successful registration
    """

    form_class = CustomUserCreationForm
    template_name = "registration/register.html"
    success_url = reverse_lazy("login")


@login_required
def index(request: WSGIRequest) -> HttpResponse:
    """Get request for /index

    Requires:
        - user to be logged in

    Args:
        request (WSGIRequest): GET request

    Returns:
        HttpResponse: Response with the html for the main app
    """
    user_notebooks = Notebook.objects.filter(user=request.user)
    return render(request, "main_app.html", {"notebooks": user_notebooks})


@login_required
def execute(request: WSGIRequest) -> HttpResponse:
    """Execute a provided string in the given language using a jupyter kernel

    Accepted languages:
        - python3
        - dyalog_apl
        - lambda-calculus

    Requires:
        - user to be logged in

    Args:
        request (WSGIRequest): POST request with the following fields:
            - language: The language to execute the code in
            - code: The code to execute

    Returns:
        HttpResponse: Response with the output of the code execution
    """
    # https://stackoverflow.com/questions/54475896/interact-with-jupyter-notebooks-via-api
    # The token is written on stdout when you start the notebook
    base = f"http://{settings.JUPYTER_URL}:{settings.JUPYTER_PORT}"
    headers = {
        "Authorization": f"Token {settings.JUPYTER_TOKEN}",
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

    # Get code from POST request body
    code = request.POST.get("code")

    try:
        # Create connection to jupyter kernel
        ws = create_connection(
            f"ws://{settings.JUPYTER_URL}:{settings.JUPYTER_PORT}/api/kernels/{active_kernel['id']}/channels",
            header=headers,
        )

        # Send code to the jupyter kernel
        ws.send(json.dumps(send_execute_request(code)))
    except ConnectionRefusedError:
        output = {
            "success": False,
            "type": "text",
            "content": "Jupyter Server Error",
        }
        return JsonResponse({"output_stream": [output]})

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
                            "content": strip_html_div(
                                rsp["content"]["data"]["text/html"]
                            ),
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
def restart_kernel(request: WSGIRequest) -> HttpResponse:
    """Restart the Juyter kernel in the given language

    Accepted languages:
        - python3
        - dyalog_apl
        - lambda-calculus

    Requires:
        - user to be logged in

    Args:
        request (WSGIRequest): POST request with the following fields:
            - language: The language of the kernel to restart

    Returns:
        HttpResponse: Success if restart was successful
    """

    base = f"http://{settings.JUPYTER_URL}:{settings.JUPYTER_PORT}"
    headers = {
        "Authorization": f"Token {settings.JUPYTER_TOKEN}",
        "Cookie": request.headers["Cookie"],
    }

    url = base + "/api/kernels"

    # Get language from frontend request
    language = request.POST.get("language")

    # Get list of existing kernels
    try:
        response = requests.get(url, headers=headers)
    except requests.exceptions.ConnectionError:
        return HttpResponse("Could not connect to Jupyter Server")

    # Get kernel ID of active kernel in given language
    existing_kernel = False
    if response:
        for kernel in json.loads(response.text):
            if kernel["name"] == language:
                kernel_id = kernel["id"]
                existing_kernel = True

    if not existing_kernel:
        return HttpResponse("No active kernel in given language")

    # Restart kernel
    url = base + f"/api/kernels/{kernel_id}/restart"
    try:
        response = requests.post(url, headers=headers)
        if response.status_code == 200:
            return HttpResponse("Restarted Kernel")
        else:
            return HttpResponse("Could not restart kernel")

    except requests.exceptions.ConnectionError:
        return HttpResponse("Could not restart kernel")


@login_required
def image_to_text(request: WSGIRequest) -> HttpResponse:
    """Convert an image to text using the handwriting recognition model

    Requires:
        - user to be logged in

    Args:
        request (WSGIRequest): POST request with the following fields:
            - model_name: The name of the model to use for conversion
            - FILE: img: The image to convert to text

    Returns:
        HttpResponse: Response with a dictionary containing the predicted characters and their probabilities
    """
    if request.method == "POST":
        image = request.FILES["img"]
        model_name = request.POST.get("model_name")

        # load image and convert to grayscale based on alpha channel
        img = Image.open(image)
        img = np.array(img)
        img = Image.fromarray(255 - img[:, :, 3]).convert("L")

        # Save the uploaded image to a temporary file
        temp_image = BytesIO()
        img.save(temp_image, format="PNG")
        temp_image.seek(0)

        request_url = (
            f"http://{settings.HANDWRITING_URL}:{settings.HANDWRITING_PORT}/translate"
        )

        files = {"image": temp_image, "json": json.dumps({"model": model_name})}

        response = requests.post(request_url, files=files)

        json_response = response.json()

        top_characters = json_response["top_preds"]
        top_character_probs = json_response["top_probs"]

        code_block_predictions_dict = {}
        code_block_predictions_set = []

        # Loop through each position in string
        for i in range(len(top_characters)):
            top_character_predictions_set = []

            # Loop through top 3 predicted characters for that position
            for j in range(len(top_characters[i])):
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


@login_required
def save_notebook(request: WSGIRequest) -> HttpResponse:
    """Save the notebook data to the database

    Args:
        request (WSGIRequest): POST request with the following fields:
            - canvas: The notebook data to save
            - notebook_name: The name of the notebook
            - notebook_id: The ID of the notebook (if it exists)

    Returns:
        HttpResponse: Response with the ID of the saved notebook and the updated list of notebooks
    """
    canvas = request.POST.get("canvas")
    notebook_name = request.POST.get("notebook_name")
    notebook_id = request.POST.get("notebook_id")

    # Create new notebook if not already existing
    if notebook_id == "-1":
        new_notebook = Notebook.objects.create(
            user=request.user, notebook_name=notebook_name, notebook_data=canvas
        )
        id_to_return = new_notebook.id
    # If existing then update to latest version of canvas and update name
    else:
        existing_notebook = Notebook.objects.get(id=notebook_id)
        existing_notebook.notebook_data = canvas
        existing_notebook.notebook_name = notebook_name
        existing_notebook.save()
        id_to_return = existing_notebook.id

    updated_user_notebooks = Notebook.objects.filter(user=request.user).values(
        "id", "notebook_name", "notebook_modified_at", "notebook_data"
    )

    return JsonResponse(
        {"notebook_id": id_to_return, "notebooks": list(updated_user_notebooks)}
    )


# Return the canvas of notebook of given ID
@login_required
def get_notebook_data(request: WSGIRequest) -> HttpResponse:
    """Get the notebook data for the given ID

    Args:
        request (WSGIRequest): POST request with the following fields:
            - notebook_id: The ID of the notebook to get.

    Returns:
        HttpResponse: Response with the notebook data, name and ID
    """
    notebook_id = request.POST.get("notebook_id")
    this_notebook = Notebook.objects.get(id=notebook_id)

    return JsonResponse(
        {
            "notebook_data": this_notebook.notebook_data,
            "notebook_name": this_notebook.notebook_name,
            "notebook_id": this_notebook.id,
        }
    )


# Delete notebook with given ID
@login_required
def delete_notebook(request: WSGIRequest) -> HttpResponse:
    """Delete the notebook with the given ID

    Args:
        request (WSGIRequest): POST request with the following fields:
            - notebook_id: The ID of the notebook to delete

    Returns:
        HttpResponse: Response with success message after notebook deletion.
    """
    notebook_id = request.POST.get("notebook_id")

    this_notebook = Notebook.objects.get(id=notebook_id)
    this_notebook.delete()

    return HttpResponse("success")


# Get the top predicted character for each position and construct a string
def create_predicted_code_block(
    code_block_prediction_dict: dict[str, list[list[str | float]]],
) -> str:
    """Generates the string from the predicted characters

    Args:
        code_block_prediction_dict (dict[str, list[list[str  |  float]]]): Character predictions

    Returns:
        str: Predicted string
    """
    predicted_characters_list = []
    all_top_predictions = code_block_prediction_dict["predictions"]

    for character_top_predictions in all_top_predictions:
        # Append the character
        predicted_characters_list.append(character_top_predictions[0]["character"])

    # Construct string from list
    predicted_string = "".join(predicted_characters_list)

    return predicted_string
