# Phase 3 — Results + Scoring

Goal: round results display immediately after a round ends, session leaderboard accumulates across rounds, host can restart or end the session.

Depends on: Phase 2 complete.

---

## 3.1 Backend — Leaderboard Update Logic

This happens inside `roundEnd.js` (Phase 2) when building the `round:finished` payload.

**`server/utils/updateLeaderboard.js`**

Called after round ends with final results array.

For each player in results:
```
entry.roundsPlayed += 1
if status === 'finished':
  if position === 1: entry.wins += 1
  entry.totalTimeMs += timeMs
  entry.averageTimeMs = totalTimeMs / roundsPlayed (finished only)
  entry.bestTimeMs = min(bestTimeMs, timeMs)
```

Sort leaderboard:
1. `wins` descending
2. `averageTimeMs` ascending (null last)
3. `bestTimeMs` ascending (null last)

Persist updated leaderboard to MongoDB Session doc.

---

## 3.2 Backend — Round History

Already stored in `session.rounds[]` (each `RoundRecord` added in `roundEnd.js`).

`round:finished` payload includes `history` — array of all `RoundRecord` summaries so far:
```json
[
  {
    "roundNumber": 1,
    "winnerUsername": "Kofi",
    "winnerTimeMs": 25432,
    "textLength": 94
  }
]
```

---

## 3.3 Backend — `round:restart` Handler

**In `server/sockets/handlers/roundHandler.js`**

Validation:
1. Room must be in `round_results`
2. Player must be host

Steps:
1. Reset `currentRound` to null in roomStore
2. Clear any lingering timers
3. Transition room status back to — skip `lobby`, go straight to `countdown` by calling the same `round:start` logic
4. Emit `session:update` first (so clients know they're back in countdown)

---

## 3.4 Backend — `session:end` Handler

**In `server/sockets/handlers/sessionHandler.js`**

Validation:
1. Player must be host
2. Room must not already be `ended`

Steps:
1. Transition room to `ended`
2. Set `session.endedAt = new Date()` in DB
3. Emit `session:update` with `status: ended` to room
4. Remove room from roomStore
5. Optionally disconnect all sockets in the room channel after brief delay

---

## 3.5 Frontend — Round Results Screen

When `round:finished` socket event received:
- If on `/race/:gameId` → navigate to `/results/:gameId` OR show results as an overlay/panel on the race page

Recommendation: navigate to dedicated `/results/:gameId` route — cleaner on mobile.

**`client/src/pages/GameResults.jsx`**

Sections:
1. Winner banner (top) — name + time
2. Round standings (ranked list) — position, username, time or DNF
3. Session leaderboard table — wins, rounds played, avg time, best time
4. Round history list — round number, winner, time
5. Host controls (bottom) — "Play Again" + "End Session"
6. Non-host waiting label — "Waiting for host..."

---

## 3.6 Frontend — Results Components

**`client/src/components/results/WinnerBanner.jsx`**
- Props: `winner: { username, timeMs }`
- Large display, crown icon

**`client/src/components/results/RoundStandings.jsx`**
- Props: `results[]`
- Shows position, username, time (or DNF)
- Highlights local player's row

**`client/src/components/results/SessionLeaderboard.jsx`**
- Props: `leaderboard[]`
- Table columns: Player, Wins, Rounds, Avg Time, Best Time
- Sorted by server order (already ranked)
- Highlight current player's row

**`client/src/components/results/RoundHistory.jsx`**
- Props: `history[]`
- List: "Round 1 — Kofi — 25.4s"

**`client/src/components/results/HostResultsControls.jsx`**
- Props: `isHost`, `onRestart`, `onEnd`
- "Play Again" → emits `round:restart`
- "End Session" → emits `session:end`

---

## 3.7 Frontend — Session End Screen

When `session:update` with `status: ended` is received (or host explicitly ends):
- Navigate to `/end/:gameId`

**`client/src/pages/SessionEnd.jsx`**
- Final session champion (most wins, or tie display)
- Full final leaderboard
- Full round history
- "Back to Home" button → navigate to `/`, reset Redux session state

---

## 3.8 Frontend — Socket Event Listeners (centralised)

**`client/src/hooks/useGameSocket.js`**

Custom hook that:
- Connects socket on mount, disconnects on unmount
- Registers all incoming event listeners
- Dispatches to local component state or Redux as appropriate
- Returns current game state

This prevents scattered `socket.on` calls across components.

Events handled:
| Event | Action |
|---|---|
| `session:update` | Update lobby players / navigate on `ended` |
| `countdown:start` | Store text + startsAt, navigate to race |
| `round:update` | Update players positions |
| `round:finished` | Store results, navigate to results |
| `player:disconnected` | Show disconnected badge on player |
| `player:reconnected` | Remove disconnected badge |
| `error` | Show error toast |

---

## 3.9 Redux — What Lives in Store

**`client/src/features/session/sessionSlice.js`** (only app-level identity):
```js
{
  playerId: null,
  username: null,
  gameId: null,
  isHost: false,
}
```

Race state, results, leaderboard — all live in component/page local state fed by socket events. Not Redux (too ephemeral, no need to persist across navigations except via re-emit on reconnect).

---

## Phase 3 Acceptance Criteria

- [ ] `round:finished` event triggers navigation to results screen on all clients
- [ ] Winner banner shows correct winner name and time
- [ ] Full ranked results list shows all players with finish times or DNF
- [ ] Session leaderboard updates correctly after each round (wins accumulate)
- [ ] Round history grows by one entry each restart
- [ ] "Play Again" (host only) starts a new countdown for the same lobby
- [ ] Non-host sees "Waiting for host..." instead of controls
- [ ] "End Session" transitions all clients to session end screen
- [ ] Session end screen shows final champion and complete history
- [ ] "Back to Home" clears session state and returns to `/`
