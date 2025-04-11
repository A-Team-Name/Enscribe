from django.urls import path

from . import views

"""
backend URL Configuration
The `urlpatterns` list routes URLs to views.
 - "/": The main page of the app
    - "/index/": The main page of the app
    - "/execute/": The API endpoint for executing code
    - "/image_to_text/": The API endpoint for converting images to text
    
"""
urlpatterns = [
    path("", views.index),
    path("index/", views.index),
    path("execute/", views.execute),
    path("image_to_text/", views.image_to_text),
]
