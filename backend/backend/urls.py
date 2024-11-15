from django.urls import path

from . import views

urlpatterns = [
    path("", views.index),
    path("index/", views.index),
    path("draw/", views.draw),
    path("code/", views.code),
    path("layering/", views.layering_demo),
]
