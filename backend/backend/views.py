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

from .models import CharacterPrediction, TopPredictions, CodeBlockPrediction


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
        
        # Initialise CodeBlockPrediction Object
        code_block = CodeBlockPrediction()
        code_block.save()

        
        request_url = f"http://{settings.HANDWRITING_URL}:{settings.HANDWRITING_PORT}/translate"
        
        files = {"image": temp_image}
        
        response = requests.post(request_url, files=files)
        
        json_response = response.json()
        
        top_characters = json_response["top_preds"][0]
        top_character_probs = json_response["top_probs"][0]

        # Loop through each position in string
        for i in range(len(top_characters)):
            # Create a TopPredictions object for position i in the current code block
            prediction_set = TopPredictions(code_block=code_block, position=i)
            prediction_set.save()

            # Loop through top 3 predicted characters for that position
            for j in range(0, 3):
                # Create a CharacterPrediction object storing the character, its probability and its ranking
                character_prediction = CharacterPrediction(
                    prediction_set=prediction_set,
                    character=top_characters[i][j],
                    probability=top_character_probs[i][j],
                    rank=j + 1,
                )
                character_prediction.save()

            code_block.predicted_text = create_predicted_code_block(code_block)
            code_block.save()

            predictions_dict = construct_predictions_dict(code_block)

        return JsonResponse(
            {
                "predicted_text": code_block.predicted_text,
                "predictions": predictions_dict,
            }
        )

    return HttpResponse("upload failed")


# Get the top predicted character for each position and construct a string
def create_predicted_code_block(code_block_prediction_obj):
    predicted_characters_list = []

    # Get a list of all TopPredictions objects
    all_top_predictions = code_block_prediction_obj.toppredictions_set.all()

    for character_top_predictions in all_top_predictions:
        # Get the top ranking CharacterPrediction object
        predicted_character_obj = (
            character_top_predictions.characterprediction_set.filter(rank=1)
        )
        # Append the character from the object
        predicted_characters_list.append(predicted_character_obj.first().character)

    # Construct string from list
    predicted_string = "".join(predicted_characters_list)

    return predicted_string


def construct_predictions_dict(code_block_prediction_obj):
    predictions_dict = {}

    all_predicted_character_lists = []
    # Put each of the top 3 character predictions a list of dicts

    # Get a list of all TopPredictions objects
    all_top_predictions = code_block_prediction_obj.toppredictions_set.all()

    for character_top_predictions in all_top_predictions:
        predicted_characters_list = []

        # Get all CharacterPrediction objects for that position in string
        predicted_character_objects = (
            character_top_predictions.characterprediction_set.all()
        )
        for predicted_character_obj in predicted_character_objects:
            # Append dictionary containing the character and its probability to list
            predicted_characters_list.append(
                {
                    "character": predicted_character_obj.character,
                    "probability": predicted_character_obj.probability,
                }
            )

        all_predicted_character_lists.append(predicted_characters_list)

    predictions_dict["predictions"] = all_predicted_character_lists

    return predictions_dict
