# Enscribe

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

## Frontend Implementation Notes
### User Interface DOM Layout
The user interface is composed of several overlapping elements, including a mixture of canvases and divs. Below is a rough illustration of how the DOM is structured:

![UI layers illustration](ui-layers.png)

The background, code and annotations stay on separate layers, which makes them easy to manipulate independently, e.g. by changing the background while still displaying code over it, or toggling annotation visibility. We will also have UI elements, such as the borders around code blocks, that must render on top of the writing layers, and are positioned accordingly. For these, we use DOM elements, which come with many benefits like dynamic scaling and styling.

When multiple elements overlap at a point, a pointer event there is sent only to the element with the highest Z index. In order for us to be able to write on the canvases underneath the UI layer, we add an extra div *with no children* that sits on top, and will capture all the whiteboard-related pointer events we are interested in. Any UI elements that should be clickable, such as buttons, can have the CSS property `z-index: 2`, which moves them above the touch input layer.
