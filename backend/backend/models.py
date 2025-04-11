from django.db import models  # noqa: F401


class CodeBlockPrediction(models.Model):
    """CodeBlockPrediction is a model that stores the predicted text for a code block.

    Inherits:
        models.Model: Django model class

    Attributes:
        predicted_text (models.CharField): The predicted text for the code block (max 50 chars).
    """

    predicted_text = models.CharField(max_length=50)


class TopPredictions(models.Model):
    """TopPredictions is a model that stores the top predictions for a code block.

    Inherits:
        models.Model: Django model class

    Attributes:
        code_block (models.ForeignKey): A foreign key to the CodeBlockPrediction model.
        position (models.IntegerField): The position of the predicted character in the code block.
    """

    code_block = models.ForeignKey(CodeBlockPrediction, on_delete=models.CASCADE)
    position = models.IntegerField()


class CharacterPrediction(models.Model):
    """CharacterPrediction is a model that stores the predicted characters for a code block.

    Inherits:
        models.Model: Django model class

    Attributes:
        prediction_set (models.ForeignKey): A foreign key to the TopPredictions model.
        character (models.CharField): The predicted character (max 1 char).
        probability (models.FloatField): The probability of the predicted character.
        rank (models.IntegerField): The rank of the predicted character.
    """

    prediction_set = models.ForeignKey(TopPredictions, on_delete=models.CASCADE)
    character = models.CharField(max_length=1)
    probability = models.FloatField()
    rank = models.IntegerField()
