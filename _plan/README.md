# Typing Arena — Implementation Plan

## Current State

| Layer | Status |
|---|---|
| `client/` | Vite + React scaffold only — no game code |
| `server/` | Bare Express app (`app.js` + `server.js`) — no DB, no sockets, no routes |
| `server/` missing | Socket.IO, Mongoose, all game logic |
| `client/` missing | All dependencies (Router, TanStack Query, Redux Toolkit, Socket.IO, Tailwind, Axios) |

---

## Locked Decisions (from spec §26)

| Decision | Value |
|---|---|
| Minimum players to start | 2 |
| Round end behavior | All active players finish OR 30s timeout after first winner |
| Text pool | Curated local seed set (hardcoded array in server) |
| Max room size | 8 players |
| Reconnect grace period | 25 seconds |
| Host disconnect | 25s grace, then auto-promote oldest active player |

---

## Phase Index

| Phase | Focus | File |
|---|---|---|
| 1 | Foundation + Lobby | [phase-1-foundation.md](./phase-1-foundation.md) |
| 2 | Race Core | [phase-2-race-core.md](./phase-2-race-core.md) |
| 3 | Results + Scoring | [phase-3-results-scoring.md](./phase-3-results-scoring.md) |
| 4 | Polish + Reconnect + Mobile UX | [phase-4-polish.md](./phase-4-polish.md) |

---

## Dependency Install Summary

### Client (`cd client`)
```bash
npm install react-router-dom @tanstack/react-query @reduxjs/toolkit react-redux axios socket.io-client qrcode.react
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Server (`cd server`)
```bash
npm init -y
npm install express cors mongoose socket.io dotenv nanoid
npm install -D nodemon jest supertest
```

---

## Environment Files Needed

### `client/.env.development`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### `client/.env.example`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### `server/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/typing-arena
CLIENT_URL=http://localhost:5173
```

### `server/.env.example`
```
PORT=5000
MONGODB_URI=
CLIENT_URL=
```
