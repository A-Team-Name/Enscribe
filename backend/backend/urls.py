from django.urls import path

from . import views
from django.views.generic.base import TemplateView

urlpatterns = [
    path("", views.index),
    path("index/", views.index),
    path("draw/", views.draw),
    path("execute/", views.execute),
    path("image_to_text/", views.image_to_text),
    path("", TemplateView.as_view(template_name="home.html"), name="home"),
]
