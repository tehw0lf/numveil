# Numveil

A real-time multiplayer number guessing game built with Angular and NestJS.

One player per session becomes the **number decider** — they submit a secret number first. All other players submit guesses. When all guesses are in, winners are calculated.

**Two game modes** (auto-selected based on player count):
- **Exact** — guess the exact number (2-player sessions)
- **Distance** — closest guess wins (3+ player sessions)

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 + Angular Material |
| Backend | NestJS 11 + WebSocket (`ws`) |
| Mobile | Capacitor 8 (Android) |
| Monorepo | Nx 22 |
| Container | Docker (nginx + node:alpine) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

```bash
npm install
```

### Development

```bash
# Serve frontend (http://localhost:4200)
npx nx serve numveil

# Serve backend (ws://localhost:4444)
npx nx serve api
```

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

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `4444` | WebSocket server port |
| `CORS_ORIGIN` | `http://localhost` | Allowed CORS origin |
| `PORT` | `3000` | HTTP server port |

**Frontend (`numveil-app`)**

| Variable | Default | Description |
|---|---|---|
| `API_URL` | `ws://localhost` | WebSocket URL |
| `API_PORT` | `4444` | WebSocket server port |

### Example Docker Compose (with Traefik)

```yaml
services:
  numveil-api:
    image: ghcr.io/tehw0lf/numveil-api:latest
    environment:
      CORS_ORIGIN: "https://numveil.example.com"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.numveil-api.rule=Host(`numveil.example.com`) && PathPrefix(`/ws`)"

  numveil-app:
    image: ghcr.io/tehw0lf/numveil-app:latest
    environment:
      API_URL: "wss://numveil.example.com"
      API_PORT: "443"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.numveil-app.rule=Host(`numveil.example.com`)"
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

| Event | Payload | Description |
|---|---|---|
| `joinSession` | `{ uuid, sessionID, name }` | Create or join a session |
| `guess` | `{ uuid, sessionID, guess }` | Submit a number |
| `newRound` | `{ uuid, sessionID }` | Start a new round |
| `leaveSession` | `{ uuid, sessionID }` | Leave session |

**Server → Client**

| Event | Description |
|---|---|
| `join` | Confirms join, returns `uuid`, `sessionID`, `pic` |
| `running` | Broadcasts updated session state to all players |
| `restart` | Signals a new round has started |

## Mobile (Android)

```bash
npm run build
npm run sync        # Sync web assets to Android project
```

The Android project lives in `apps/numveil/android/`.

## License

MIT
