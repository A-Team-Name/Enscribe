# forms.py
from django import forms
from .models import Image


class ImageForm(forms.ModelForm):
    """Form for uploading an image.

    Inherits:
        forms.ModelForm: Django model form class
    """

    class Meta:
        """
        Meta class for the ImageForm.

        Attributes:
            model (Image): The model to use for the form.
            fields (list): The fields to include in the form.
        """

        model = Image
        fields = ["name", "img"]
