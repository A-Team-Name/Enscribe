import datetime
import uuid
import random

def generate(
    p         = 1,
    variables = set(),
    scale     = 0.5,
    max_depth = 5,
):
    def generate_ast(p, variables, depth):
        if len(variables) > 0 and (depth == max_depth or random.random() >= p):
            return random.choice(list(variables))
        if depth == max_depth:
            return ('λ', 'x', 'x')
        q = p * scale
        if random.random() < 0.5:
            return (
                generate_ast(q, variables, depth + 1),
                generate_ast(q, variables, depth + 1),
            )
        v = random.choice('abcdefghijklmnopqrstuvwxyz')
        return ('λ', v, generate_ast(q, variables | {v}, depth + 1))

    def print_ast(ast, merge = False):
        match ast:
            case (f, x):
                ff = print_ast(f)
                xx = print_ast(x)
                if isinstance(f, tuple) and len(f) == 3:
                    ff = '(' + ff + ')'
                if isinstance(x, tuple):
                    xx = '(' + xx + ')'
                return ff + xx
            case ('λ', c, x):
                s = c
                if not merge: s = 'λ' + s
                merge_again = isinstance(x, tuple) and len(x) == 3
                if not merge_again: s = s + '.'
                return s + print_ast(x, merge_again)
            case s:
                return s

    ast = generate_ast(p, variables, 0)
    # print(ast)
    return print_ast(ast)

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
