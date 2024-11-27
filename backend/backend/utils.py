import datetime
import uuid


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
