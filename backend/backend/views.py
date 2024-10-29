from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

import json
import requests
from websocket import create_connection
from backend.utils import *


# Create your views here.
def index(request: WSGIRequest) -> HttpResponse:
    return render(request, 'index.html')

def draw(request: WSGIRequest) -> HttpResponse:
    return render(request, 'canvas_drawing.html')

@csrf_exempt
def execute(request) -> HttpResponse:
    # https://stackoverflow.com/questions/54475896/interact-with-jupyter-notebooks-via-api
    # The token is written on stdout when you start the notebook
    base = 'http://localhost:8888'
    headers = {'Authorization': 'Token c34247f110ac07d5364b8287090ad0fe6230621677694eba'}

    url = base + '/api/kernels'
    response = requests.post(url,headers=headers)
    kernel = json.loads(response.text)


    # Create connection to jupyter kernel
    ws = create_connection("ws://localhost:8888/api/kernels/"+kernel["id"]+"/channels",
        header=headers)
    
    # Get code from POST request body 
    code = request.POST.get('code')

    # Send code to the jupyter kernel 
    ws.send(json.dumps(send_execute_request(code)))

    # Process response
    msg_type = ''
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

    return HttpResponse(output)

