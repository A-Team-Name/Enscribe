#!/bin/sh
if [ "$FLASK_ENV" = "development" ]; then
    exec poetry run python -m flask run --debug --host=0.0.0.0
else
    poetry add gunicorn
    exec poetry run gunicorn --bind 0.0.0.0:5000 app:app
fi