# Security & Robustness Gaps

Issues that are not MVP-blocking but are required before any public exposure.

---

## 1 — No rate limiting on socket events

**Risk:** A client can call `session:create` in a tight loop and flood the server with new MongoDB documents and in-memory rooms, causing OOM and DB exhaustion.

**Affected events:** `session:create`, `session:join`, `round:start`, `round:restart`

**Fix:** Use `socket.io-rate-limiter` or a custom per-socket throttle:

```js
// Simple per-socket throttle map
const lastCreate = new Map();

socket.on("session:create", (data) => {
  const last = lastCreate.get(socket.id) || 0;
  if (Date.now() - last < 3000) return; // 1 creation per 3s
  lastCreate.set(socket.id, Date.now());
  // ... handler
});
```

---

## 2 — No rate limiting on REST endpoints

**Risk:** `POST /api/sessions` (currently 501) and `GET /api/sessions/:gameId` can be called at high frequency without restriction.

**Fix:** Add `express-rate-limit` to `app.js`:

```js
import rateLimit from "express-rate-limit";

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests" },
}));
```

---

## 3 — Socket payload size is not validated

**Spec requirement (section 20):** "prevent oversized payloads"

**Current state:** `username` length is validated (2–20 chars via `sanitizeUsername`), but raw socket payloads have no size guard. `correctChars`, `gameId`, and other fields are not type-validated for all handlers.

**Missing validations:**
- `gameId` should be verified as a string of expected length (6 chars)
- `playerId` should be a string matching known format
- `correctChars` in `round:progress` only validates int and monotonic increase, but not that it actually matches the server's known text for that round

**Fix:** Add a lightweight payload guard at the top of each handler:

```js
function isValidGameId(id) {
  return typeof id === "string" && /^[A-Z0-9]{6}$/.test(id);
}
```

---

## 4 — Socket IDs are emitted to all players in `session:update`

**Spec requirement (section 20):** "do not expose internal socket IDs publicly"

**File:** `server/utils/sessionHelpers.js` — `buildSessionUpdate`

**Check:** Verify that `buildSessionUpdate` strips `socketId` from the players array before emitting. If `socketId` is included in the broadcast, all players can see each other's socket IDs, which enables targeted socket attacks.

**Expected fix:**
```js
function buildSessionUpdate(room) {
  return {
    gameId: room.gameId,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    players: Array.from(room.players.values()).map(({ socketId, ...rest }) => rest),
    leaderboard: room.leaderboard,
  };
}
```

---

## 5 — No CORS guard for production socket connection

**File:** `server/sockets/index.js`

**Current state:** Socket.IO CORS uses `CLIENT_URL` from env, which is correct. But if `CLIENT_URL` is not set, the filter array is `[undefined].filter(Boolean)` = `[]`, which means Socket.IO may default to allowing all origins.

**Verify:** Test that Socket.IO correctly rejects connections when `CLIENT_URL` is missing. If it doesn't, add a startup check.

---

## 6 — No payload guard against `null` / `undefined` inputs on socket handlers

**Risk:** If a malformed payload arrives (e.g., `{ gameId: null }`), code like `getRoom(null)` returns undefined but downstream code may throw.

**Fix:** Add null-checks at handler entry points:

```js
socket.on("round:progress", ({ gameId, playerId, correctChars } = {}) => {
  if (!gameId || !playerId) return;
  // ...
});
```
