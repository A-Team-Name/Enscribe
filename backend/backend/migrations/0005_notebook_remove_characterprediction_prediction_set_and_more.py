# Generated by Django 5.1.2 on 2025-03-31 16:24

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("backend", "0004_rename_lineprediction_codeblockprediction_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notebook",
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
                ("notebook_name", models.CharField(max_length=255)),
                ("notebook_data", models.JSONField()),
                ("notebook_modified_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.RemoveField(
            model_name="characterprediction",
            name="prediction_set",
        ),
        migrations.RemoveField(
            model_name="toppredictions",
            name="code_block",
        ),
        migrations.DeleteModel(
            name="Image",
        ),
        migrations.DeleteModel(
            name="CharacterPrediction",
        ),
        migrations.DeleteModel(
            name="CodeBlockPrediction",
        ),
        migrations.DeleteModel(
            name="TopPredictions",
        ),
    ]
