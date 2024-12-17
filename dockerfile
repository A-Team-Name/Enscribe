FROM python:3.11-slim

COPY poetry.lock poetry.lock

COPY pyproject.toml pyproject.toml

RUN pip install poetry

RUN poetry config virtualenvs.create false

RUN poetry install

WORKDIR /app

COPY ./app .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
