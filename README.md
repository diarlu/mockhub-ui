# MockHub UI

Web UI for the [MockHub](../mockhub) mock server: create, edit and test mock endpoints without writing JSON by hand.

- **Mocks**: create endpoints with a form (method, path with `*` wildcards or regex, status, body, headers), reorder,
  duplicate and delete them, and send test requests right from the list.
- **Files**: drag and drop files to upload them, then turn any file into a mock with one click.
- **JSON**: view, edit, import and download the whole mock list as JSON (same format as `POST /mockpairs`).
- **Workspaces**: use the global workspace or create private ones. The UI remembers your workspaces in the browser,
  and `?workspace=<id>` links open a workspace directly.

## Quick start

Requirements: Node.js 20.19+ (or 22.12+) and Java 17+ for the server.

### One process: UI built into the server

`build-and-run.cmd` (in this folder; expects the server in `../mockhub`) builds the UI, moves `dist` to
`mockhub/src/main/resources/ui`, builds the server jar and starts it:

```
build-and-run.cmd
```

The UI is then served by the server itself (`FrontendController`) at **http://localhost:8083/ui/** and calls the API
on the same server. Only `/ui` is reserved; every other path is still available for mocks. The copied UI is
git-ignored in the mockhub project.

### Two processes: for working on the UI

Changes show up instantly (hot reload):

```bash
# 1. Start the MockHub server (port 8083)
cd ../mockhub
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 2. Start the UI (port 5173) – opens the browser
cd ../mockhub-ui
npm install                     # first time only
npm start
```

### Server on another address

The UI expects the server at `http://localhost:8083`. To use another one, set `MOCKHUB_API_URL`:

```bash
MOCKHUB_API_URL=http://my-server:8083 npm start          # bash
$env:MOCKHUB_API_URL="http://my-server:8083"; npm start   # PowerShell
```

## How it talks to the server

The browser only talks to the UI's own origin. Requests to `/api/*` are forwarded to the MockHub server with the
`/api` prefix removed (by Vite in development, by nginx in the Docker image), so the server needs no CORS setup:

```
http://localhost:5173/api/<workspace-id>/users/1  →  http://localhost:8083/<workspace-id>/users/1
```

Your apps can call mocks either way: directly on the server (port 8083), or through the UI's `/api` URL shown at the
top of the page.

The UI needs a server version that has `GET /mockpairs` (to list saved mocks). Older servers show a message asking
for an update.

## Docker

Run the server and the UI together (the server is built from `../mockhub`):

```bash
docker compose up --build
```

- UI: http://localhost:8080
- Mocks: http://localhost:8083/... (or http://localhost:8080/api/...)
- Mocks are stored in the `mockhub-mocks` volume, the same one the MockHub README uses.

To run only the UI image against an existing server, set `MOCKHUB_SERVER` (host:port):

```bash
docker build -t mockhub-ui .
docker run -p 8080:80 -e MOCKHUB_SERVER=host.docker.internal:8083 mockhub-ui
```

## Scripts

| Command           | Description                                       |
|-------------------|---------------------------------------------------|
| `npm start`       | Development server on port 5173, opens the browser |
| `npm run dev`     | Same, without opening the browser                 |
| `npm run build`   | Type-check and build into `dist/`                 |
| `npm run build:embedded` | Build for serving by the MockHub server under `/ui/` (used by `build-and-run.cmd`) |
| `npm run preview` | Serve the built `dist/` on port 4173 (with the API proxy) |
| `npm run lint`    | Lint with oxlint                                  |

## Tech stack

React 19, TypeScript, [Vite](https://vite.dev), [Mantine](https://mantine.dev) (UI components),
[TanStack Query](https://tanstack.com/query) (server state) and [Tabler icons](https://tabler.io/icons).

## Project structure

```
src/
  api/          REST client (client.ts), API calls (mockhub.ts), React Query hooks (queries.ts), models (types.ts)
  workspace/    Workspace selection, persistence in localStorage, picker and dialogs
  mocks/        Mock list, editor drawer, test request dialog
  files/        File upload and list
  json/         Raw JSON editor
  components/   Small shared components
  lib/          HTTP helpers (methods, status texts, examples), notifications, styles
nginx/          nginx config template for the Docker image
```
