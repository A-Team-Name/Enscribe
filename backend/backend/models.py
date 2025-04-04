from django.db import models  # noqa: F401
from django.contrib.auth.models import User


class Notebook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="entries")
    notebook_name = models.CharField(max_length=255)
    notebook_data = models.JSONField()
    notebook_created_at = models.DateTimeField(
        auto_now_add=True
    )  # Automatically sets the timestamp
