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

    print(request.POST.get("language"), flush=True)

    url = base + "/api/kernels"
    response = requests.post(
        url, headers=headers, json={"name": request.POST.get("language")}
    )
    kernel = json.loads(response.text)
    print("ws://kernel:8888/api/kernels/" + kernel["id"] + "/channels", flush=True)
    # Create connection to jupyter kernel
    ws = create_connection(
        "ws://kernel:8888/api/kernels/" + kernel["id"] + "/channels", header=headers
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
