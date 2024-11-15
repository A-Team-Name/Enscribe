from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render

import json
import requests
from websocket import create_connection
from backend.utils import send_execute_request


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
    output = []
    while True:
        rsp = json.loads(ws.recv())
        print(rsp, flush=True)
        msg_type = rsp["msg_type"]
        output.append(rsp)
        if msg_type == "execute_reply":
            break

    ws.close()
    context = {"input": code, "output": output}
    return render(request, "index.html", context)
    # return HttpResponse(output)
