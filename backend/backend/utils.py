import datetime
import uuid
import json
import requests
from websocket import create_connection


def send_execute_request(code):
    hdr = {
        "msg_id": uuid.uuid1().hex,
        "username": "test",
        "session": uuid.uuid1().hex,
        "data": datetime.datetime.now().isoformat(),
        "msg_type": "execute_request",
        "version": "5.0",
    }
    return {
        "header": hdr,
        "parent_header": hdr,
        "metadata": {},
        "content": {
            "code": code,
            "silent": False,
        },
    }


def start_or_use_existing_kernel(request, language):
    # https://stackoverflow.com/questions/54475896/interact-with-jupyter-notebooks-via-api
    # The token is written on stdout when you start the notebook
    base = "http://kernel:8888"
    headers = {
        "Authorization": "Token ",
        "Cookie": request.headers["Cookie"],
        # "X-XSRFToken": request.COOKIES["_xsrf"],
    }

    url = base + "/api/kernels"

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

    return ws
