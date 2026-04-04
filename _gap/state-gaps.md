# State & Data Integrity Gaps

Issues where transient React state causes the app to break on page refresh or on unexpected navigation.

---

## 1 — `roundResults` is lost on page refresh (affects `/results` and `/end`)

**Root cause:**  
`roundResults` is stored only in `useGameSocket` hook state (React `useState`). It is populated when the `round:finished` socket event arrives. A page refresh discards all React state.

**Affected pages:**
- `GameResults.jsx` — shows "Loading results..." indefinitely after refresh
- `SessionEnd.jsx` — shows empty leaderboard and history after refresh

**Fix options:**

### Option A — Persist `roundResults` in Redux (recommended)
Add `roundResults` to `sessionSlice`:
```js
setRoundResults: (state, action) => {
  state.roundResults = action.payload;
},
```
Dispatch from `useGameSocket` when `round:finished` fires:
```js
dispatch(setRoundResults(data));
```
Read from Redux in `GameResults` and `SessionEnd` as fallback when hook state is null.

### Option B — Fetch from REST on mount
Use `GET /api/sessions/:gameId` to reconstruct the last round results from the session's `rounds` array when `roundResults` is null. Requires `getSession` controller to return full `rounds` and `leaderboard`.

---

## 2 — Race page (`/race/:gameId`) loses state on refresh

**File:** `client/src/pages/GameRace.jsx:27-31`

**What happens:**  
On refresh, `raceState` is null (hook state cleared). The guard `if (!raceState && !playerId)` redirects home only if both are null. If Redux still has `playerId` (from localStorage or in-session), `raceState` is null but the redirect doesn't fire — user sees a blank race screen.

The socket reconnection in `socket.js` sends `session:reconnect` on connect, which triggers `handleReconnect` in `reconnectManager.js`. That handler correctly re-sends `countdown:start` for in-progress rounds, which will repopulate `raceState`. So the flow **does work** — but there's a brief blank state while reconnect completes.

**Improvement:** Show a loading/reconnecting state instead of blank screen while `raceState` is null but socket is reconnecting.

---

## 3 — `SessionEnd` page when session ends without any rounds played

**Scenario:** Host creates room, no round is played, host clicks "End Session".

**What happens:**
1. `session:end` fires → server broadcasts `session:update` with `status: "ended"`
2. All clients navigate to `/end/:gameId`
3. `roundResults` is null (no `round:finished` ever fired)
4. `sessionData` from `useGameSocket` was last the lobby state (no leaderboard/history)
5. Page shows "Session Over" with completely empty leaderboard and history

**Fix:** `SessionEnd` should fetch `GET /api/sessions/:gameId` on mount. The REST controller already returns session data including `leaderboard` and `rounds`. Use this as the data source when `roundResults` is null.

---

## 4 — `GameLobby` page has no redirect guard for ended sessions

**File:** `client/src/pages/GameLobby.jsx`

**What happens:** If a user manually navigates to `/game/:gameId` for a session that has already ended, the `useSession` TanStack Query hook fetches `GET /api/sessions/:gameId`. The controller returns an error if the session is ended. But if the fetch succeeds and returns ended session data, the lobby renders without context.

**Fix:** In `GameLobby`, after the session fetch resolves, check if `session.status === "ended"` and redirect to home with a toast.

---

## 5 — Redux session identity is not persisted to localStorage

**Current behavior:**  
Redux state (`playerId`, `username`, `gameId`, `isHost`) is lost on page refresh unless `session:reconnect` restores it from the server.

**Problem:**  
If `VITE_*` env vars are wrong and the socket fails to connect, there's no stored identity to reconnect with. Also, `socket.js` reads Redux state synchronously on `connect` to emit `session:reconnect` — if Redux was cleared, reconnect doesn't fire.

**Fix:** Add `redux-persist` with localStorage for the `session` slice, or manually persist `playerId`+`gameId` to `sessionStorage` when they are set, and rehydrate on app load.

This is low priority if the socket reconnect path works reliably, but is a robustness improvement.
