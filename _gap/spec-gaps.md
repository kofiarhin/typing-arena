# Spec Gaps

Features listed in the product spec that are not yet implemented or are only partially present.

---

## 1 — WPM / accuracy indicator in race UI (spec section 6.5)

**Spec says:** "Optional personal stats: correct chars, progress %, WPM"  
**Status:** Not implemented. `GameRace.jsx` shows no WPM or accuracy.

**WPM formula:**
```
wpm = (correctChars / 5) / (elapsedMs / 60000)
```

**Implementation:** Compute in `GameRace.jsx` using `correctChars` state and `raceState.startsAt`. Display in a small stat bar above or below the input.

---

## 2 — Lobby: "minimum players" warning before host can start

**Spec section 7.4 / 10.3:** Cannot start with fewer than minimum players.  
**Current:** `HostControls` disables the Start button if `players.length < 2`, which is correct. But there is no tooltip or inline message explaining WHY it's disabled.

**Fix:** Add `title` attribute or visible inline text: "Need at least 2 players to start."

---

## 3 — No loading state on `GameLobby` during initial session fetch

**File:** `client/src/pages/GameLobby.jsx`  
**Status:** `useSession` query runs but the page may render with an empty player list before data arrives.

**Fix:** Show a loading skeleton or spinner while `isLoading` is true from `useSession`.

---

## 4 — No "Start With One Player" decision communicated to player

**Spec section 16.6:** "Decision needed — recommended: minimum 2 players"  
**Status:** Server enforces it (emits `NOT_ENOUGH_PLAYERS` error) and the button is disabled. But the error message from the server is shown via the `ErrorToast`, which is present. This is adequate — mark as handled.

---

## 5 — Analytics is stubbed (spec section 19)

**File:** `server/utils/analytics.js`  
**Status:** All `track(...)` calls log to console only. The spec lists 9 events to track.

**Events currently called:**
- `room_created` ✓
- `room_joined` ✓
- `round_started` ✓
- `round_finished` ✓
- `session_ended` ✓
- `player_disconnected` ✓ (called twice — second call has wrong event name)
- `player_reconnected` ✓
- `session_restarted` ✗ — `round:restart` does not call `track`

**Missing from analytics.js:**
- Real transport (any analytics service or structured log aggregator)
- `session_restarted` track call in `round:restart` handler

**For MVP:** acceptable to remain as structured console logs. Replace with a real service before public launch.

---

## 6 — `session_restarted` track call missing

**File:** `server/sockets/handlers/roundHandler.js`  
**Status:** `round:restart` has no `track(...)` call.

**Fix:**
```js
track("session_restarted", { gameId, roundNumber: room.currentRound?.roundNumber });
```

---

## 7 — QR code in lobby uses hardcoded join URL format

**File:** `client/src/components/lobby/SharePanel.jsx`  
**Status:** The share URL is built from `window.location.origin + /game/:gameId` or from `session:created` response. Verify that the `joinUrl` from `session:created` (which uses `CLIENT_URL` env var) matches the client's actual deployed URL.

**If `CLIENT_URL` is set correctly:** this works.  
**If not set:** `joinUrl` is `"undefined/game/AB12CD"` (see `critical-bugs.md` Bug 5).

---

## 8 — `buildSessionUpdate` — verify socketId is stripped from broadcast

**File:** `server/utils/sessionHelpers.js`  
**Spec section 20:** "do not expose internal socket IDs publicly"

**Action:** Read `buildSessionUpdate` and confirm `socketId` is excluded from the players array in the emitted payload. If not, strip it.

This is also listed in `security-gaps.md` but merits a spec compliance note here.

---

## 9 — Host reconnect grace then auto-promote (spec section 16.3)

**Status:** Implemented. `reconnectManager.js` has 25s grace timer and `promoteNewHost` function. Fully matches spec recommendation.  
**Mark as complete.**

---

## 10 — Player disconnect mid-race → DNF status (spec section 16.2)

**Status:** Partially implemented. When a player disconnects mid-race, `handleDisconnect` marks `isActive: false`. In `roundEnd.js`, players in `playerProgress` who haven't finished are assigned `status: "dnf"`. However, a disconnected player who was never added to `playerProgress` (disconnected before round started) won't appear in results.

**Verify:** That only players present in `currentRound.playerProgress` appear in results. Players who left before the round started should not appear. Current code iterates `playerProgress` keys only — this is correct.

---

## 11 — Paste blocking on mobile (spec section 7.6)

**File:** `client/src/components/race/TypingInput.jsx`  
**Status:** The agent noted paste is blocked (`onPaste` prevents default). Verify this also works on iOS (some iOS keyboards bypass `onPaste`). May need to additionally monitor input `value` length changes for suspicious jumps and reset input.

---

## 12 — Autocorrect / autocomplete disabled on mobile input (spec section 12.4)

**File:** `client/src/components/race/TypingInput.jsx`  
**Verify** that the input has:
```jsx
autoCorrect="off"
autoComplete="off"
autoCapitalize="off"
spellCheck={false}
```
All four are required for proper mobile behavior.
