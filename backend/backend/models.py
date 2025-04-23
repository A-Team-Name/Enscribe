from django.db import models  # noqa: F401
from django.contrib.auth.models import User


class Notebook(models.Model):
    """model representing a notebook for the application

    Inherits:
        Model: Django's base model class

    Attributes:
        user (User): The user who owns the notebook.
        notebook_name (str): The name of the notebook.
        notebook_data (dict): The data of the notebook in JSON format.
        notebook_modified_at (datetime): The timestamp when the notebook was last modified.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="entries")
    notebook_name = models.CharField(max_length=255)
    notebook_data = models.JSONField()
    notebook_modified_at = models.DateTimeField(
        auto_now=True
    )  # Automatically sets the timestamp
