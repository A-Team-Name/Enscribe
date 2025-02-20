from django.urls import path

from . import views

urlpatterns = [
    path("", views.index),
    path("index/", views.index),
    path("draw/", views.draw),
    path("execute/", views.execute),
    path("image_to_text/", views.image_to_text),
    path("lambda_calculus/", views.get_random_lambda_line),
]
