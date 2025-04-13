from django.urls import path

from . import views
from .views import RegisterView

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
    path("save_notebook/", views.save_notebook),
    path("get_notebook_data/", views.get_notebook_data),
    path("delete_notebook/", views.delete_notebook),
    path("register/", RegisterView.as_view(), name="register"),
]
