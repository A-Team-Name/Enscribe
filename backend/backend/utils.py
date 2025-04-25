from typing import Any

import datetime
import re
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


def strip_html_div(html: str) -> str:
    """Remove the <div> tags from the html string.

    Args:
        html (str): The html string to strip

    Returns:
        str: The stripped html string
    """
    regex_str = r"^<.*?>(.*?)<\/.*?>$"
    regex = re.compile(regex_str, re.DOTALL)
    matches = regex.findall(html)
    if len(matches) == 0:
        return html
    return matches[0]
