from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render  # , redirect

import json
from backend.utils import send_execute_request, start_or_use_existing_kernel

from .forms import ImageForm


# Create your views here.
def index(request: WSGIRequest) -> HttpResponse:
    context = {"input": "", "output": ""}
    return render(request, "index.html", context)


def draw(request: WSGIRequest) -> HttpResponse:
    return render(request, "canvas_drawing.html")


def main_app(request: WSGIRequest) -> HttpResponse:
    start_or_use_existing_kernel(request, "dyalog_apl")

    return render(request, "main_app.html")


def layering_demo(request: WSGIRequest) -> HttpResponse:
    return render(request, "layering_demo.html")


def execute(request: WSGIRequest) -> HttpResponse:
    idle = False
    reply = False

    request_body = json.loads(request.body)
    language = request_body["language"]
    code = request_body["code"]

    # Start a kernel in desired language or connect to existing
    ws = start_or_use_existing_kernel(request, language)

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

        if output:
            full_response.append(output)

        # Check the execution state of kernel
        if msg_type == "status":
            print(rsp["content"]["execution_state"])
            try:
                if rsp["content"]["execution_state"] == "idle":
                    idle = True
            except KeyError:
                continue
        elif msg_type == "execute_reply":
            reply = True

        # if execution_state is idle and execute_reply has been received then stop polling
        if idle and reply:
            break

    # if output == {}:
    #     output["type"] = "http"
    #     output["content"] = full_response

    ws.close()
    # context = {"input": code, "output": output},
    # return render(request, "index.html", context)
    # request.session["language"] = language
    # request.session["input"] = code
    # request.session["output"] = json.dumps(full_response)
    # return redirect("/")
    return HttpResponse(
        json.dumps(
            {
                "code": code,
                "output": full_response,
            }
        )
    )


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
