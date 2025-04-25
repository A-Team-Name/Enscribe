# forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class CustomUserCreationForm(UserCreationForm):
    """Custom user creation form that extends the default UserCreationForm

    Inherits:
        UserCreationForm: Django's built-in user creation form

    Attributes:
        email (EmailField): The email address of the user.
        first_name (CharField): The first name of the user.
        last_name (CharField): The last name of the user.
    """

    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=False)
    last_name = forms.CharField(max_length=30, required=False)

    class Meta:
        """Meta class for CustomUserCreationForm
        Attributes:
            model (User): The user model to use.
            fields (tuple): The fields to include in the form.
        """

        model = User
        fields = (
            "first_name",
            "last_name",
            "username",
            "email",
            "password1",
            "password2",
        )

    def save(self, commit=True):
        """function to save the user instance

        Args:
            commit (bool, optional): Whether to commit to database. Defaults to True.

        Returns:
            user (User): The saved user instance.
        """
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        if commit:
            user.save()
        return user
