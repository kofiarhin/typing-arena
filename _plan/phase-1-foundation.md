# Phase 1 — Foundation + Lobby

Goal: players can create a room, share a link/QR code, join the lobby, and see live player list updates. No gameplay yet.

---

## 1.1 Backend Setup

### Files to create

**`server/package.json`**
- scripts: `dev` (nodemon), `start` (node), `test` (jest)
- dependencies: express, cors, mongoose, socket.io, dotenv, nanoid

**`server/config/env.js`**
```js
// Centralised env access — throws early if required vars are missing
module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: process.env.CLIENT_URL,
}
```

**`server/.env`** + **`server/.env.example`**

**`server/app.js`** — rewrite
- Express setup
- JSON body parser
- CORS using `CLIENT_URL` env var
- Mount `/api/sessions` router
- 404 + error handler middleware

**`server/server.js`** — rewrite
- Load dotenv
- Connect Mongoose
- Create HTTP server from app
- Attach Socket.IO
- Call `sockets/index.js` with the io instance
- Listen on PORT

---

## 1.2 Session Model

**`server/models/Session.js`**

Mongoose schema matching spec §14:
```
Session
  gameId          String, unique, required
  status          enum: lobby|countdown|in_progress|round_results|ended
  hostPlayerId    String
  createdAt       Date
  endedAt         Date|null
  currentRoundNumber  Number default 0
  players         [PlayerSessionSnapshot]
  leaderboard     [LeaderboardEntry]
  rounds          [RoundRecord]
```

Sub-schemas:
- `PlayerSessionSnapshot` — playerId, username, socketId, isHost, isActive, joinedAt, disconnectedAt
- `LeaderboardEntry` — playerId, username, wins, roundsPlayed, totalTimeMs, averageTimeMs, bestTimeMs
- `RoundRecord` — roundNumber, text, textLength, startedAt, endedAt, winnerPlayerId, winnerUsername, winnerTimeMs, results[]

---

## 1.3 In-Memory Active Room Store

**`server/utils/roomStore.js`**

Simple Map-based store for active game state (fast, avoids DB on every progress tick):
```js
const rooms = new Map()
// key: gameId
// value: { session snapshot + per-round race state }

module.exports = { getRooms, getRoom, setRoom, deleteRoom }
```

Active room state shape per game:
```js
{
  gameId,
  status,
  hostPlayerId,
  players: Map<playerId, { playerId, username, socketId, isHost, isActive }>,
  currentRound: {
    roundNumber,
    text,
    startedAt,       // ms timestamp
    playerProgress: Map<playerId, { correctChars, finished, finishTimeMs, rank }>
  } | null
}
```

---

## 1.4 Text Pool

**`server/utils/textPool.js`**

Curated array of 10–15 short/medium texts (80–220 chars). Export `getRandomText()`.

Example texts:
- "The quick brown fox jumps over the lazy dog near the river bank."
- "Practice makes perfect, and perfection is what we are aiming for today."
- etc.

---

## 1.5 Session Utility Helpers

**`server/utils/sessionHelpers.js`**
- `generateGameId()` — 6-char uppercase alphanumeric using nanoid or crypto
- `sanitizeUsername(str)` — trim, strip unsafe chars, enforce 2–20 length, return cleaned string or null
- `buildSessionUpdate(room)` — returns the `session:update` payload from room state
- `buildLeaderboardEntry(playerId, username)` — initialise a blank leaderboard row

---

## 1.6 REST Routes — Sessions

**`server/routes/sessions.js`**
**`server/controllers/sessionController.js`**

| Method | Path | Action |
|---|---|---|
| POST | `/api/sessions` | Create room, save to DB + roomStore, return gameId + joinUrl |
| GET | `/api/sessions/:gameId` | Return session summary (status, players, leaderboard, rounds) |
| POST | `/api/sessions/:gameId/end` | End session, clear room store, update DB |

Validation:
- POST create: username required, sanitised
- GET: return 404 if not found or ended
- POST end: check host authority via body `playerId`

---

## 1.7 Socket.IO Setup

**`server/sockets/index.js`**
```js
// Attach all socket handlers to io instance
module.exports = function initSockets(io) {
  io.on('connection', (socket) => {
    // register handlers
  })
}
```

**`server/sockets/handlers/sessionHandler.js`**

Handles:
- `session:create`
  1. Sanitise username
  2. Generate gameId
  3. Create room in roomStore + Session doc in DB
  4. Join socket to room channel (`socket.join(gameId)`)
  5. Emit `session:created` back to socket
  6. Emit `session:update` to room

- `session:join`
  1. Validate room exists and status is `lobby`
  2. Sanitise username, check uniqueness in room
  3. Add player to roomStore
  4. Update Session DB doc
  5. Join socket to room channel
  6. Emit `session:joined` back to socket
  7. Emit `session:update` to whole room

- `session:leave`
  1. Mark player inactive in roomStore
  2. Update DB
  3. Emit `session:update` to room

- `disconnect`
  1. Find player by socketId across rooms
  2. Mark inactive, record `disconnectedAt`
  3. Emit `player:disconnected` to room
  4. Start reconnect grace timer (25s) — if not reconnected, mark as DNF / remove

---

## 1.8 Frontend Setup

### Install all client deps (see README)

### Tailwind setup
Add `@tailwindcss/vite` plugin to `vite.config.js`. Add `@import "tailwindcss"` to `index.css`.

### App shell — files to create/modify

**`client/src/main.jsx`** — wrap with:
- `BrowserRouter`
- `QueryClientProvider` (TanStack Query)
- `Provider` (Redux store)

**`client/src/app/store.js`** — Redux store with `sessionSlice`

**`client/src/features/session/sessionSlice.js`**
```js
// Global client state only:
// { playerId, username, gameId, isHost }
```

**`client/src/services/api.js`** — Axios client reading `VITE_API_URL`, fail-fast guard

**`client/src/services/socket.js`** — Socket.IO singleton reading `VITE_SOCKET_URL`
```js
import { io } from 'socket.io-client'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
if (!SOCKET_URL) throw new Error('Missing VITE_SOCKET_URL')
export const socket = io(SOCKET_URL, { autoConnect: false })
```

**`client/src/routes/AppRoutes.jsx`**
```
/           → Home
/game/:gameId  → GameLobby
/race/:gameId  → GameRace
/end/:gameId   → SessionEnd
```

---

## 1.9 Pages + Components — Phase 1

### Home page (`client/src/pages/Home.jsx`)
- App logo/title
- "Create Game" button → opens create modal
- "Join Game" input + button → navigates to `/game/:gameId`

### Create Game modal (`client/src/components/shared/CreateGameModal.jsx`)
- Username input (validation: 2–20 chars, no unsafe chars)
- Submit → `session:create` socket emit → on `session:created` save to Redux + navigate to `/game/:gameId`

### GameLobby page (`client/src/pages/GameLobby.jsx`)
Listens to `session:update` socket event. Shows:
- Room URL copy button
- QR code (`qrcode.react`)
- Share button (Web Share API with fallback)
- Player list with host badge
- "Start Game" button (host only, disabled < 2 players)
- "Leave" button

### Lobby components:
- `client/src/components/lobby/PlayerList.jsx`
- `client/src/components/lobby/SharePanel.jsx` (URL + QR)
- `client/src/components/lobby/HostControls.jsx`

### Join flow
- Navigating to `/game/:gameId` with no Redux state → show username entry modal
- On submit → `session:join` socket emit → on `session:joined` → save to Redux, stay on lobby

---

## 1.10 TanStack Query Hook

**`client/src/hooks/queries/useSession.js`**
```js
// Fetches session summary via GET /api/sessions/:gameId
// Used on initial page load to validate room exists before showing join form
```

---

## Phase 1 Acceptance Criteria

- [ ] Host creates room, receives gameId + URL
- [ ] QR code and copy link visible in lobby
- [ ] Second player joins via URL, sees username prompt
- [ ] Both players appear in lobby player list in real time
- [ ] Host badge is visible on host's entry
- [ ] "Start Game" disabled with only 1 player, enabled at 2+
- [ ] Joining an ended or non-existent room shows an error and returns to home
- [ ] Duplicate username in same room is rejected with a message
