# Critical Bugs

These bugs will cause core game functionality to fail silently.

---

## Bug 1 — `round:restart` does nothing after state reset

**File:** `server/sockets/handlers/roundHandler.js:153`

**What it does now:**
```js
socket.emit("round:start", { gameId, playerId });
```

**Problem:**  
`socket.emit(...)` on the server sends the event to the **client browser**, not to the server's own `round:start` handler. The client has no listener for a server-pushed `round:start` event. The result: room status resets to `"lobby"`, `currentRound` is cleared, but no countdown ever fires. Players are stuck.

**Fix:**  
Extract the round-start logic (inside the `socket.on("round:start", ...)` handler) into a shared function like `startNewRound(gameId, hostPlayerId, io)`, then call it directly from both `round:start` and `round:restart`.

```js
// utils/roundManager.js (new file or inline in roundHandler)
function startNewRound(gameId, playerId, io) {
  const room = getRoom(gameId);
  // ... all the existing round:start logic
}

// In round:start handler:
socket.on("round:start", ({ gameId, playerId }) => {
  // validate...
  startNewRound(gameId, playerId, io);
});

// In round:restart handler (instead of socket.emit):
startNewRound(gameId, playerId, io);
```

---

## Bug 2 — `round:finish` handler sends event to client, not server

**File:** `server/sockets/handlers/roundHandler.js:124`

**What it does now:**
```js
socket.on("round:finish", ({ gameId, playerId, correctChars }) => {
  socket.emit("round:progress", { gameId, playerId, correctChars });
});
```

**Problem:**  
`socket.emit("round:progress", ...)` sends to the client browser. The server-side `round:progress` handler is never triggered. If the client emits `round:finish`, the player's completion is silently ignored.

**Fix:**  
Extract the progress/finish logic from `round:progress` into a shared function and call it from both handlers.

```js
function handleProgress(room, playerId, correctChars, gameId, io) {
  // ... existing round:progress body
}

socket.on("round:progress", ({ gameId, playerId, correctChars }) => {
  const room = getRoom(gameId);
  if (!room || room.status !== "in_progress") return;
  handleProgress(room, playerId, correctChars, gameId, io);
});

socket.on("round:finish", ({ gameId, playerId, correctChars }) => {
  const room = getRoom(gameId);
  if (!room || room.status !== "in_progress") return;
  handleProgress(room, playerId, correctChars, gameId, io);
});
```

---

## Bug 3 — `SessionEnd` page shows empty data when session ends early

**File:** `client/src/pages/SessionEnd.jsx:20`

**What it does now:**
```js
const { roundResults } = useGameSocket({ playerId, gameId });
const leaderboard = roundResults?.leaderboard || [];
const history = roundResults?.history || [];
```

**Problem:**  
`roundResults` is set in `useGameSocket` only when a `round:finished` socket event arrives. If the session ends from the lobby (no round played) or the host ends manually mid-session, `roundResults` is null. The page renders "Session Over" with empty leaderboard and history.

**Fix:**  
When `roundResults` is null, fetch the session from REST to get the final leaderboard and history:

```js
const { data: sessionData } = useQuery({
  queryKey: ["session", gameId],
  queryFn: () => api.get(`/sessions/${gameId}`).then(r => r.data),
  enabled: !roundResults,
});

const leaderboard = roundResults?.leaderboard ?? sessionData?.leaderboard ?? [];
const history = roundResults?.history ?? sessionData?.rounds?.map(...) ?? [];
```

Also requires `GET /api/sessions/:gameId` to return `leaderboard` and `rounds` — it currently returns a sanitized view; verify that both are included.

---

## Bug 4 — `GameResults` page breaks on page refresh

**File:** `client/src/pages/GameResults.jsx:26`

**What it does now:**
```js
const { roundResults } = useGameSocket({ playerId, gameId });
if (!roundResults) {
  return <p>Loading results...</p>;
}
```

**Problem:**  
`roundResults` is stored only in hook state. A page refresh clears React state. The page shows "Loading results..." indefinitely because the `round:finished` event won't re-fire.

**Fix (two options):**

Option A — Fetch from REST on mount if `roundResults` is null:
```js
const { data } = useQuery({
  queryKey: ["session", gameId],
  queryFn: () => api.get(`/sessions/${gameId}`).then(r => r.data),
  enabled: !roundResults,
});
// Derive last round results from session data as fallback
```

Option B — Persist `roundResults` to Redux so it survives in-session refreshes.  
Add a `setRoundResults` action to `sessionSlice` and dispatch it from `useGameSocket` when `round:finished` arrives.

Option B is simpler and doesn't require the REST endpoint to change.

---

## Bug 5 — `CLIENT_URL` may be undefined in `joinUrl`

**File:** `server/sockets/handlers/sessionHandler.js:74`

**What it does now:**
```js
joinUrl: `${process.env.CLIENT_URL}/game/${gameId}`,
```

**Problem:**  
If `CLIENT_URL` is not set in the environment, the `joinUrl` sent to the client becomes `"undefined/game/AB12CD"`. The QR code and share link will be broken.

**Fix:**  
Add `CLIENT_URL` to the startup validation in `server/server.js` (alongside `MONGODB_URI`). Also add a runtime guard:

```js
const joinUrl = process.env.CLIENT_URL
  ? `${process.env.CLIENT_URL}/game/${gameId}`
  : `/game/${gameId}`;
```

And add `CLIENT_URL` to `.env.example`.
