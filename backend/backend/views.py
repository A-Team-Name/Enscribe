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
    # Return specific execution output if recognised format otherwise return entire response
    output = {}
    full_response = []
    while True:
        rsp = json.loads(ws.recv())
        print(rsp, flush=True)
        msg_type = rsp["msg_type"]

        if language == "python3":
            if msg_type == "stream":
                output["success"] = "true"
                output["type"] = "text"
                output["content"] = rsp["content"]["text"]

            elif msg_type == "execute_result":
                output["success"] = "true"
                output["type"] = "text"
                output["content"] = rsp["content"]["data"]["text/plain"]

            elif msg_type == "error":
                output["success"] = "false"
                output["type"] = "ascii-text"
                output["content"] = rsp["content"]["traceback"]

        elif language == "dyalog_apl":
            if msg_type == "execute_result":
                output["success"] = "true"
                output["type"] = "html"
                output["content"] = rsp["content"]["data"]["text/html"]

            if msg_type == "stream":
                output["success"] = "false"
                output["type"] = "text"
                output["content"] = rsp["content"]["text"]

        full_response.append(rsp)
        if msg_type == "execute_reply":
            break

    if output == {}:
        output["type"] = "http"
        output["content"] = full_response

    ws.close()
    # context = {"input": code, "output": output}
    # return render(request, "index.html", context)
    request.session["language"] = language
    request.session["input"] = code
    request.session["output"] = output
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
