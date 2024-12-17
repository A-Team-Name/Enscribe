#!/bin/sh
if [ "$DJANGO_ENV" = "development" ]; then
    python ./manage.py runserver 0.0.0.0:"${PORT:-5000}"
else
    python ./manage.py collectstatic
    python ./manage.py migrate
    gunicorn --bind 0.0.0.0:"${PORT:-5000}" thesite.wsgi:application
fi
