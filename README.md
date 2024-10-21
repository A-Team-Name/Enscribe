# Enscribe

## Development
### Docker
This repo has been setup to make development using docker containers as easy as
- `git clone ...`
- `docker-compose up --build`

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