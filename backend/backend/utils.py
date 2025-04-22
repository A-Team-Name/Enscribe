from typing import Any

import datetime
import uuid


def send_execute_request(code: str) -> dict[str, Any]:
    """Generate the required message to send to jupyter kernel to execute code.

    Args:
        code (str): The code to execute

    Returns:
        dict[str, Any]: The message to send to the jupyter kernel
    """
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
