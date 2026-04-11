# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Serve frontend (Angular, port 4200)
npx nx serve numveil

# Serve backend (NestJS WebSocket API)
npx nx serve api

# Run tests
npx nx test numveil        # Frontend unit tests
npx nx test api                # Backend unit tests
npx nx test <project> -- --testFile=<path>  # Single test file

# E2E tests
npx nx e2e numveil-e2e    # Playwright frontend E2E
npx nx e2e api-e2e            # Jest backend E2E

# Lint
npx nx lint numveil
npx nx lint api

# Build
npm run build                  # Build all projects
npx nx build numveil       # Frontend only
npx nx build api               # Backend only

# Mobile (Capacitor/Android)
npm run sync                   # Sync web assets to Android project
```

### Pre-commit validation

```bash
npm run affected:lint && npm run affected:test && npm run affected:build && npm run e2e
```

## Architecture

This is an Nx monorepo with three projects:

- **`apps/api`** — NestJS WebSocket server (single file: `app.gateway.ts`)
- **`apps/numveil`** — Angular 21 frontend (web + Android via Capacitor)
- **`libs/core`** — Shared types and environment config imported by both apps as `@numveil/core`

### Game mechanics

One player per session becomes the "number decider" — they submit a secret number first (`guess` is `undefined` in the server state for that player). Other players submit guesses. When all non-decider players have guessed, winners are calculated.

**Two game modes** (auto-selected server-side):
- `GameMode.exact` — players must guess the exact number (2-player sessions)
- `GameMode.distance` — closest guess wins (3+ player sessions, switches automatically on third join)

### WebSocket protocol

All messages use `{ event: string, data: any }` from client and `{ eventType: string, serverState: any }` from server.

| Client event | Purpose |
|---|---|
| `joinSession` | Create or join a session (omit `sessionID` to create new) |
| `guess` | Submit a number (first submission becomes the secret number) |
| `newRound` | Reset the current session for another round |
| `leaveSession` | Remove self from session |

| Server event | Purpose |
|---|---|
| `join` | Confirms join, sends back `uuid`, `sessionID`, `pic` |
| `running` | Broadcasts updated session state to all players |
| `restart` | Signals a new round has started |

### Frontend state management

`StateService` holds all Angular signals. `SessionService` owns the WebSocket connection and routes incoming server events to `StateService`. Components inject both services.

Route guards (`RouteGuard`) prevent direct navigation to `/home` or `/result` without an active session.

### Shared library (`libs/core`)

- `environment.ts` — `api_url`, `api_port` (4444), `baseRoutePath`
- `types/` — `Player`, `GameMode`, `SessionUser`, `UserInfo`

The environment file is the single source of truth for the WebSocket URL used by both the frontend client and the backend `@WebSocketGateway` decorator.

### Mobile

The Angular app is wrapped via Capacitor (`apps/numveil/capacitor.config.ts`). The Android project lives in `apps/numveil/android/`. The `npm run sync` script copies the built web assets into the Android project.

### Docker

`Dockerfile.api` and `Dockerfile.app` at the workspace root. CI builds and publishes both Docker images on pushes to `main`.
