# OCAI

Interactive story and character interface demo.

Live site: https://oocai.netlify.app/

## Deploy
Netlify publishes the `dist` directory using `netlify.toml`. No build step or dependencies are required.

## Chat behavior
This demo does **not** call an AI model. `reply()` in `dist/app.js` returns predetermined responses selected using simple keyword checks and conversation length. Conversations, favorites, created titles and settings are stored in browser localStorage. Authentication and payments are demos. Artwork is placeholder SVG.

## Local preview
Run `python -m http.server 8000 --directory dist` and open http://localhost:8000.
