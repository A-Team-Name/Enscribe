# Enscribe

hi
hi
hi
hi
## Development
### Docker
This repo has been setup to make development using docker containers as easy as possible.
- `git clone ...`

The only thing you need to do is create a .env file in the outermost directory of this repo:
.env:
```env
DJANGO_ENV='development'
SECRET_KEY='...'
PORT=...
```
Replace the ... with some random string. Django can generate a key for you with the following CLI command:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

If `PORT` is not specified, the default is `5000`.

From here you can build and the start the container
- `docker-compose build`
- `docker-compose up`

This will launch the application locally and is accessible at `localhost:5000`.

### Local
Alternatively you can install the requirements yourself and run using python locally. This project uses poetry for package management.
- `git clone ...`
- `pip install poetry` - one time only!
- `cd backend`
- `poetry install`
- `poetry run python app.py`

### pre-commit
If you are contributing to this project we would greatly appreciate you setup our pre-commit hook to ensure you are following our formatting standard. This can be done easily:
- `cd backend`
- `poetry install` - If not already done¬
- `poetry run pre-commit install`

Now whenever you attempt to commit, our ruff formatting checks will be ran automatically.
