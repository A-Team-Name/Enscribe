from django.core.handlers.wsgi import WSGIRequest
from django.http import HttpResponse
from django.shortcuts import render


# Create your views here.
def index(request: WSGIRequest) -> HttpResponse:
    return render(request, "index.html")


def draw(request: WSGIRequest) -> HttpResponse:
    return render(request, "canvas_drawing.html")


def main_app(request: WSGIRequest) -> HttpResponse:
    return render(request, "main_app.html")


def layering_demo(request: WSGIRequest) -> HttpResponse:
    return render(request, "layering_demo.html")
