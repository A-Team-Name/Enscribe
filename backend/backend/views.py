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
    response = requests.get(url, headers=headers)
    kernel = json.loads(response.text)[0]
    # Create connection to jupyter kernel
    ws = create_connection(
        "ws://kernel:8888/api/kernels/" + kernel["id"] + "/channels", header=headers
    )

    # Get code from POST request body
    code = request.POST.get("code")

    # Send code to the jupyter kernel
    ws.send(json.dumps(send_execute_request(code)))

    # Process response
    msg_type = ""
    while True:
        rsp = json.loads(ws.recv())
        msg_type = rsp["msg_type"]
        output = ""
        if msg_type == "stream":
            output = rsp["content"]["text"]
            print(output)
            break
        if msg_type == "error":
            output = rsp["content"]["ename"] + "\n" + rsp["content"]["evalue"] + "\n"
            # traceback uses text colour
            for line in rsp["content"]["traceback"]:
                output += line + "\n"
            print(output)
            break

    ws.close()
    context = {"input": code, "output": output}
    return render(request, "index.html", context)
    # return HttpResponse(output)
