from django.db import models  # noqa: F401


class CodeBlockPrediction(models.Model):
    predicted_text = models.CharField(max_length=50)


class TopPredictions(models.Model):
    code_block = models.ForeignKey(CodeBlockPrediction, on_delete=models.CASCADE)
    position = models.IntegerField()


class CharacterPrediction(models.Model):
    prediction_set = models.ForeignKey(TopPredictions, on_delete=models.CASCADE)
    character = models.CharField(max_length=1)
    probability = models.FloatField()
    rank = models.IntegerField()
