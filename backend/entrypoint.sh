#!/bin/sh
poetry run python ./manage.py collectstatic
poetry run python ./manage.py migrate
if [ "$DJANGO_ENV" = "development" ]; then
    poetry run python ./manage.py runserver 0.0.0.0:5000
else
    poetry run gunicorn --bind 0.0.0.0:5000 thesite.wsgi:application
fi
