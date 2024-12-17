from django.db import models  # noqa: F401

# Create your models here.


class Image(models.Model):
    name = models.CharField(max_length=50)
    img = models.ImageField(upload_to="images/")
