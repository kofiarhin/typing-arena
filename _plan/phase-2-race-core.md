# Phase 2 — Race Core

Goal: host starts the game, synced countdown runs, all players type the same text, avatars move in real time, first to finish wins.

Depends on: Phase 1 complete.

---

## 2.1 Backend — Round Start

**`server/sockets/handlers/roundHandler.js`**

### `round:start` handler
Validation:
1. Room must be in `lobby` or `round_results` state
2. Emitting player must be host
3. Minimum 2 active players

Steps:
1. Select text via `getRandomText()`
2. Compute `startsAt = Date.now() + 3000` (3s countdown)
3. Transition room state to `countdown`
4. Initialise `currentRound` in roomStore:
   - `roundNumber = session.currentRoundNumber + 1`
   - `text`
   - `startedAt = null` (set when countdown ends)
   - `playerProgress = new Map()` (all active players, all zeros)
5. Emit `countdown:start` to room:
   ```json
   { "gameId", "roundNumber", "countdownSeconds": 3, "startsAt", "text" }
   ```
6. Schedule server-side timer: after 3s → transition to `in_progress`, set `startedAt = Date.now()`

---

## 2.2 Backend — Progress Updates

### `round:progress` handler
Payload: `{ gameId, playerId, correctChars, inputLength, clientTime }`

Validation:
1. Room must be `in_progress`
2. `correctChars` must be >= last known value (monotonic)
3. `correctChars` must be <= `text.length`

Steps:
1. Update `playerProgress[playerId].correctChars`
2. Compute `progress = correctChars / text.length`
3. If `correctChars === text.length` and not yet finished:
   - Mark `finished = true`
   - Set `finishTimeMs = Date.now() - currentRound.startedAt`
   - Assign rank (increment from last rank)
   - Check if all active players finished → trigger round end

Broadcast throttle: collect updates, broadcast `round:update` to room at ~100ms intervals using `setInterval` per room (clear on round end).

`round:update` payload:
```json
{
  "gameId",
  "roundNumber",
  "players": [{ playerId, username, progress, correctChars, finished, finishTimeMs, rank }],
  "leaderPlayerId"
}
```

### `round:finish` handler (explicit finish signal, belt + suspenders)
Same as progress handler when `correctChars === text.length`.

---

## 2.3 Backend — Round End

**`server/utils/roundEnd.js`** (helper called from roundHandler)

Triggers when:
- All active players are `finished`, OR
- 30s timeout after first finisher

Steps:
1. Clear broadcast interval
2. Clear timeout timer
3. Compute final rankings (sort by finishTimeMs, DNF last)
4. Transition room state to `round_results`
5. Build `RoundRecord` and push to DB Session doc
6. Update `leaderboard` in DB (wins, roundsPlayed, totalTimeMs, bestTimeMs, averageTimeMs)
7. Emit `round:finished` to room:
   ```json
   {
     "gameId", "roundNumber",
     "winner": { playerId, username, timeMs },
     "results": [{ playerId, username, position, timeMs, status }],
     "leaderboard": [...],
     "history": [...]
   }
   ```

---

## 2.4 Backend — Broadcast Interval Manager

**`server/utils/broadcastManager.js`**

Manages per-room broadcast intervals to prevent memory leaks:
```js
const intervals = new Map()  // gameId → intervalId

startBroadcast(gameId, io, roomStore)  // starts 100ms interval
stopBroadcast(gameId)                  // clears interval
```

---

## 2.5 Frontend — Countdown Overlay

When `countdown:start` socket event received:
- Save `text`, `roundNumber`, `startsAt` to local component state
- Navigate to `/race/:gameId`
- Show fullscreen countdown overlay
- Count down from 3 using `startsAt` as reference (not just a local timer, avoids drift)
- On `GO`: unlock input, hide overlay

**`client/src/components/race/CountdownOverlay.jsx`**
- Props: `startsAt`
- Uses `useEffect` + `setInterval` to tick display
- Shows `3 → 2 → 1 → GO`

---

## 2.6 Frontend — Race Page

**`client/src/pages/GameRace.jsx`**

State managed locally (not Redux — ephemeral race state):
- `text` — the round text
- `inputValue` — controlled input
- `correctChars` — provisional local progress count
- `players` — from `round:update` events
- `phase` — `countdown | racing | finished`

Socket listeners:
- `countdown:start` → set text, enter countdown phase
- `round:update` → update players state
- `round:finished` → navigate to results (or show results inline)

---

## 2.7 Frontend — Typing Input

**`client/src/components/race/TypingInput.jsx`**

Rules:
- Controlled `<input>` or `<textarea>`
- `autoComplete="off"` `autoCorrect="off"` `autoCapitalize="off"` `spellCheck="false"`
- `onPaste={(e) => e.preventDefault()}`
- Disabled when `phase !== 'racing'`
- `onChange` handler:
  1. Compute `correctChars` (sequential character matching against `text`)
  2. Update local state immediately (optimistic)
  3. Move local avatar instantly
  4. Throttle emit `round:progress` to ~100ms

**Progress calculation util** — `client/src/utils/progressCalc.js`
```js
export function calcCorrectChars(text, input) {
  let count = 0
  for (let i = 0; i < input.length; i++) {
    if (input[i] === text[i]) count++
    else break
  }
  return count
}
```

---

## 2.8 Frontend — Text Display

**`client/src/components/race/TextDisplay.jsx`**

Props: `text`, `correctChars`, `inputValue`

Renders text as spans:
- `correct` — chars typed correctly (green or highlighted)
- `current` — next expected char (cursor highlight)
- `error` — chars typed wrong (red, for chars beyond correctChars within input)
- `remaining` — untyped chars

---

## 2.9 Frontend — Race Track

**`client/src/components/race/RaceTrack.jsx`**

Props: `players`, `text.length`, `localPlayerId`

Renders one lane per player (stacked vertically on mobile):
- `RaceLane` component per player
- Avatar position: `left: ${progress * 100}%` using CSS transform for perf
- Finish line on right
- Leader highlighted (crown icon or bold lane)
- Local player's avatar moves from local state (optimistic); others from `round:update`

**`client/src/components/race/RaceLane.jsx`**
- Props: `player`, `isLocal`, `isLeader`
- Avatar at `transform: translateX(${progress * trackWidth}px)` — use JS-computed px to avoid layout thrash

Animation: use `transition: transform 0.1s linear` on avatar for smooth movement between updates.

---

## 2.10 Frontend — Progress Emit Hook

**`client/src/hooks/useProgressEmit.js`**
```js
// Throttles round:progress emits to 100ms
// Takes correctChars, text.length, gameId, playerId
// Emits via socket
// Also emits round:finish when correctChars === text.length
```

---

## Phase 2 Acceptance Criteria

- [ ] Host clicks "Start Game" → countdown overlay shows on all clients simultaneously
- [ ] Input is locked during countdown, unlocks on GO
- [ ] All players see the same text
- [ ] Typing correct chars advances local avatar instantly
- [ ] Server broadcasts correct positions to all players at ~100ms intervals
- [ ] Other players' avatars move in real time
- [ ] Leading player is visually distinct (crown / highlight)
- [ ] First player to finish 100% of correct chars is declared winner
- [ ] Incorrect char does not advance progress; must be deleted first
- [ ] Paste is blocked
