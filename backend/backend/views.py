from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render, redirect

import json
import requests
from websocket import create_connection
from backend.utils import send_execute_request

from .forms import ImageForm


# Create your views here.
def index(request: WSGIRequest) -> HttpResponse:
    context = {"input": "", "output": ""}
    return render(request, "index.html", context)


def draw(request: WSGIRequest) -> HttpResponse:
    return render(request, "canvas_drawing.html")


def execute(request: WSGIRequest) -> HttpResponse:
    # https://stackoverflow.com/questions/54475896/interact-with-jupyter-notebooks-via-api
    # The token is written on stdout when you start the notebook
    base = "http://kernel:8888"
    headers = {
        "Authorization": "Token ",
        "Cookie": request.headers["Cookie"],
        "X-XSRFToken": request.COOKIES["_xsrf"],
    }

    url = base + "/api/kernels"

    # Get execution language from frontend request
    language = request.POST.get("language")

    # Get list of existing kernels
    response = requests.get(url, headers=headers)

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
        "ws://kernel:8888/api/kernels/" + active_kernel["id"] + "/channels",
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
        print(msg, flush=True)
        rsp = json.loads(msg)
        # print(rsp, flush=True)
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
                            "type": "text",
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

        if output:
            full_response.append(output)
        if msg_type == "execute_reply":
            break

    # if output == {}:
    #     output["type"] = "http"
    #     output["content"] = full_response

    ws.close()
    # context = {"input": code, "output": output},
    # return render(request, "index.html", context)
    request.session["language"] = language
    request.session["input"] = code
    request.session["output"] = json.dumps(full_response)
    return redirect("/")
    # return HttpResponse(output)


def image_to_text(request):
    if request.method == "POST":
        form = ImageForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()

            # Call handwriting recognition API

            return HttpResponse("successfully uploaded")
    else:
        form = ImageForm()
    return HttpResponse("upload failed")
