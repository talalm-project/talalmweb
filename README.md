# TalaLM Web

The web frontend for TalaLM

## Tech Stack

* [`esbuild`](https://esbuild.github.io/)
* [`react-bootstrap`](https://react-bootstrap.netlify.app/)
* [`dotenv`](https://github.com/motdotla/dotenv)
* [`postcss`](https://github.com/postcss/postcss)
* [`sass`](https://sass-lang.com/)
* [`axios`](https://github.com/axios/axios)
* [`react-markdown`](https://github.com/remarkjs/react-markdown)


## Setup

1. Install all packages

```bash
npm install
```

2. Copy `.env.dist` to `.env` and change values accordingly.

* `API_BASE_URL`: Backend server
* `TOKEN_KEY_BEARER`: Key for token (makes use of `localStorage`)
* `CURRENT_USER`: Key for the logged in user

3. (optional) Run the mock server

```bash
npm run mock-server
```

4. Run the application server

```bash
npm run start
```

## Routing

Public routes live in `src/js/App.js` and render without authentication. The default public page is the login screen at `/`, and `/login` renders the same screen. Authenticated routes render inside the sidebar layout once a session exists.

## Connectors

The authenticated connector screens let users create, list, view, and edit
model connectors backed by the API `/connectors` endpoints.

The connector detail page includes a `Test Connector` panel. It behaves like a
scrollable chat interface and sends prompts to:

```text
POST /connectors/:id/infer
```

The chat panel sends conversation history as chat messages and renders assistant
responses with Markdown via `react-markdown`. This matches the backend default
inference system prompt, which asks models to answer in Markdown.

## Clone for a new project

Use this repo as a starting point for your own project named `myprojectweb`.

```bash
git clone <REPO_URL> myprojectweb
cd myprojectweb
rm -rf .git
git init
```

## Upgrading all packages

Run first `npm-check-updates`:

```bash
npx npm-check-updates -u
```

Confrim updates then run `npm install`.
