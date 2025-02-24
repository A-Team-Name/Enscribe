# Generated by Django 5.1.2 on 2025-01-23 13:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LinePrediction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("predicted_line", models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name="CharacterImage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("img_name", models.CharField(max_length=100)),
                ("img_file", models.ImageField(upload_to="images/")),
                ("position", models.IntegerField()),
                (
                    "line",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="backend.lineprediction",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="TopPredictions",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "image",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="backend.characterimage",
                    ),
                ),
                (
                    "line",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="backend.lineprediction",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CharacterPrediction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("character", models.CharField(max_length=1)),
                ("probability", models.FloatField()),
                ("rank", models.IntegerField()),
                (
                    "prediction_set",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="backend.toppredictions",
                    ),
                ),
            ],
        ),
    ]
