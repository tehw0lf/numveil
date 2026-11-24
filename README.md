# Numveil

A real-time multiplayer number guessing game built with Angular and NestJS.

One player per session becomes the **number decider** — they submit a secret number first. All other players submit guesses. When all guesses are in, winners are calculated.

**Two game modes** (auto-selected based on player count):

- **Exact** — guess the exact number (2-player sessions)
- **Distance** — closest guess wins (3+ player sessions)

## Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Frontend  | Angular 22 + Angular Material |
| Backend   | NestJS 11 + WebSocket (`ws`)  |
| Mobile    | Capacitor 8 (Android)         |
| Monorepo  | Nx 24                         |
| Container | Docker (nginx + node:alpine)  |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

```bash
npm install
```

### Development

```bash
# Serve frontend (http://localhost:4216)
npx nx serve numveil

# Serve backend (ws://localhost:4444)
npx nx serve api
```

### Regenerating the lockfile

Prefer targeted updates (`npm install <pkg>@<version>`). When the whole lockfile has to be regenerated, remove `node_modules` together with the lockfile, never the lockfile alone:

```bash
rm -rf node_modules package-lock.json && npm install
```

A lockfile written over an existing `node_modules` can come back without `resolved` and `integrity` for packages npm did not fetch (for example when `node_modules` has no current `node_modules/.package-lock.json`). The same applies in `apps/numveil`. A full regeneration re-resolves all transitive ranges and moves versions. `npm run lint:lockfile` checks that every registry entry (any key with a `node_modules/` segment, including one under a workspace folder, except links and bundled dependencies) of both lockfiles carries both fields; it also runs as part of `npm run lint` and `npm run affected:lint`.

### Testing

```bash
npx nx test numveil     # Frontend unit tests
npx nx test api         # Backend unit tests
npx nx e2e numveil-e2e  # Playwright E2E tests
```

### Building

```bash
npm run build           # Build all projects
npx nx build numveil    # Frontend only
npx nx build api        # Backend only
```

## Docker

Docker images are built for both the frontend (nginx) and backend (node).

```bash
docker build -f Dockerfile.api -t numveil-api .
docker build -f Dockerfile.app -t numveil-app .
```

### Environment Variables

**Backend (`numveil-api`)**

| Variable      | Default            | Description           |
| ------------- | ------------------ | --------------------- |
| `API_PORT`    | `4444`             | WebSocket server port |
| `CORS_ORIGIN` | `http://localhost` | Allowed CORS origin   |
| `PORT`        | `3000`             | HTTP server port      |

**Frontend (`numveil-app`)**

| Variable   | Default          | Description           |
| ---------- | ---------------- | --------------------- |
| `API_URL`  | `ws://localhost` | WebSocket URL         |
| `API_PORT` | `4444`           | WebSocket server port |

`API_URL` is the scheme and a host name or IPv4 address only (scheme `ws` or `wss`, no path, no trailing slash; an IPv6 literal is refused because the policy cannot express it); `API_PORT` is a number from 1 to 65535. The container refuses to start with other values. It adds `API_URL:API_PORT` to the `connect-src` directive of the Content Security Policy next to `'self'`, so on the web the "Server URL" field can only reach the page's own origin and the configured server (the Android app is not restricted by this policy).

### Example Docker Compose (with Traefik)

```yaml
services:
  numveil-api:
    image: ghcr.io/tehw0lf/numveil-api:latest
    environment:
      CORS_ORIGIN: 'https://numveil.example.com'
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.numveil-api.rule=Host(`numveil.example.com`) && PathPrefix(`/ws`)'

  numveil-app:
    image: ghcr.io/tehw0lf/numveil-app:latest
    environment:
      API_URL: 'wss://numveil.example.com'
      API_PORT: '443'
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.numveil-app.rule=Host(`numveil.example.com`)'
```

## Architecture

```
apps/
├── api/            # NestJS WebSocket server
└── numveil/        # Angular frontend (web + Android via Capacitor)
libs/
└── core/           # Shared types
```

### WebSocket Protocol

**Client → Server**

| Event          | Payload                      | Description              |
| -------------- | ---------------------------- | ------------------------ |
| `joinSession`  | `{ uuid, sessionID, name }`  | Create or join a session |
| `guess`        | `{ uuid, sessionID, guess }` | Submit a number          |
| `newRound`     | `{ uuid, sessionID }`        | Start a new round        |
| `leaveSession` | `{ uuid, sessionID }`        | Leave session            |

**Server → Client**

| Event     | Description                                       |
| --------- | ------------------------------------------------- |
| `join`    | Confirms join, returns `uuid`, `sessionID`, `pic` |
| `running` | Broadcasts updated session state to all players   |
| `restart` | Signals a new round has started                   |

## Mobile (Android)

```bash
npm run build
npm run sync        # Sync web assets to Android project
```

The Android project lives in `apps/numveil/android/`.

## License

MIT
