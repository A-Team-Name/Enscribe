# Welcome to Enscribe Documentation

This section of the documentation explains our frontend and primary backend microservices.

## Frontend
The frontend is a bespoke JavaScript application that provides users with a whiteboard interface to handwrite code.

## Backend
The backend is a Django application that both serves the frontend and provides several API endpoints for the frontend to interact with (as Mentioned in the [API documentation](api.md)).

### Project Structure

```
├── backend
│   ├── forms.py        # Defines user input forms
│   ├── models.py       # Defines models
│   ├── urls.py         # Defines API endpoints
│   ├── utils.py        # Utility functions
│   ├── views.py        # Defines application views
│   ├── static
│   │   ├── *.svg       # SVG files for logos
│   │   ├── *.png       # PNG files for user guide images
│   │   ├── modules
│   │   │   ├── *.mjs   # Modular JavaScript files for frontend interactivity
│   ├── templates
│   │   ├── *.html      # HTML files for frontend content
│   ├── dockerfile      # Deploy containerised application
│   ├── entrypoint.sh   # Defines entrypoints
│   ├── manage.py       # Run application
```

### API Endpoints
The core API endpoints used by the frontend are:

```POST: /image_to_text  ```

Receives a screen capture of a code selection from the frontend to preprocess and send to handwriting recognition server.

```POST /execute  ```

Receives transcribed text to send to a Jupyter kernel to be executed.

```POST /save_notebook ```

Receives the latest state of a notebook to save or update in ```Notebook``` model.

```GET /get_notebook_data ```

Returns the serialised notebook for a given ID.

```POST /delete_notebook```

Receives an ID to remove from the ```Notebook``` model.


### Models

The application uses two models for persistent storage:

```User``` - Stores attributes of each user including name, email address and password

```Notebook``` - Stores attributes of each notebook including owner of notebook, JSON data and last modified date.

Full model details can be found in [Models Documentations](models.md)
