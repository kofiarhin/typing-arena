# Phase 4 — Polish, Reconnect + Mobile UX

Goal: handle edge cases gracefully, reconnect players mid-session, optimise mobile layout, and harden the experience for real use.

Depends on: Phases 1–3 complete.

---

## 4.1 Reconnect Handling

### Backend

**`server/utils/reconnectManager.js`**

On `disconnect`:
1. Mark player inactive in roomStore, record `disconnectedAt`
2. Emit `player:disconnected` to room
3. Start 25s grace timer stored by `socketId`

On new connection (`connection` event), after `session:join` or a new `session:reconnect` event:
1. Look up player by `playerId` (from client-stored identity)
2. If found inactive and within grace period: restore player, clear timer
3. Update `socketId` in roomStore and DB
4. Re-join socket to room channel
5. Emit current state snapshot back to reconnecting client:
   - If `lobby` or `round_results`: emit `session:update`
   - If `in_progress`: emit `countdown:start` equivalent + `round:update`
6. Emit `player:reconnected` to room

If grace expires without reconnect:
- In `in_progress`: mark as DNF in current round progress
- In `lobby`: remove from room
- If disconnected player was host and no reconnect: auto-promote oldest active player, emit `session:update`

### Frontend

**`client/src/services/socket.js`** — add reconnect logic:
```js
socket.on('connect', () => {
  const { playerId, gameId } = store.getState().session
  if (playerId && gameId) {
    socket.emit('session:reconnect', { playerId, gameId })
  }
})
```

Show a reconnecting banner when socket disconnects temporarily.

**`client/src/components/shared/ConnectionStatus.jsx`**
- Shows dot: green (connected), yellow (reconnecting), red (disconnected > 5s)
- Position: fixed top-right corner on race screen

---

## 4.2 Host Disconnect + Auto-Promote

In `reconnectManager.js`, after 25s grace if host is still gone:
1. Find oldest active player (by `joinedAt`)
2. Set as new host in roomStore and DB
3. Emit `session:update` to room with new `isHost` flags

Frontend:
- Redux `sessionSlice` `isHost` flag updates on `session:update` event
- "Start Game" / "End Session" buttons appear for new host automatically

---

## 4.3 Edge Case Guards

### Empty lobby after round
After `round:finished`, if only 1 or 0 active players remain:
- Automatically transition to `ended`
- Emit `session:update` with `status: ended`

### Late progress after round ends
In `round:progress` handler: early return if `room.status !== 'in_progress'`

### Restart spam debounce
In `round:restart` handler:
- Store `lastRestartAt` per room
- Ignore if called within 2s of last restart

### Join ended room
In `session:join` handler: if `room.status === 'ended'`, emit `error: { code: 'ROOM_ENDED' }`

### Solo start prevention
In `round:start`: count active players, reject with error if < 2

---

## 4.4 Mobile UX Polish

### Input stays visible when keyboard opens
- Race page layout: fixed bottom input, scrollable text + track above
- Use `dvh` units to handle mobile viewport height changes
- Test on iOS Safari (most restrictive)

### Track layout on mobile
- Vertical stacked lanes, each lane ~60–70px tall
- Avatar is an emoji or small icon (easy on first impl)
- Username truncated to ~10 chars with ellipsis

### Touch targets
- All buttons: minimum `h-12` (48px) Tailwind
- Input: `text-lg` minimum, `p-3` padding

### Keyboard considerations
- `inputMode="text"` on typing input to get full keyboard
- `autoCapitalize="off"` to prevent iOS from capitalising first char
- Wrap race view in a container that doesn't scroll when keyboard opens:
  ```css
  height: 100dvh;
  display: flex;
  flex-direction: column;
  ```

---

## 4.5 Performance

### Avatar animation
- Use `transform: translateX()` only — not `left` (triggers layout)
- `transition: transform 100ms linear` — matches broadcast interval
- Avoid rerendering entire track on every update; use `React.memo` on `RaceLane`

### Socket broadcast optimisation
- `round:update` payload: only send `playerId`, `correctChars`, `finished`, `finishTimeMs`, `rank`
- Derive `progress` client-side: `progress = correctChars / text.length`
- Store `text.length` in local state after `countdown:start`

### Prevent full re-renders
- `useCallback` on socket event handlers
- `useMemo` on derived leaderboard sorts
- `React.memo` on `PlayerList`, `RaceLane`, `RoundHistory`

---

## 4.6 Error States + User Feedback

**`client/src/components/shared/ErrorToast.jsx`**
- Listens to socket `error` events
- Displays message for 4s then auto-dismisses
- Error codes mapped to user-friendly messages:
  ```js
  const ERROR_MESSAGES = {
    ROOM_NOT_FOUND: 'This game doesn\'t exist.',
    ROOM_ENDED: 'This game has already ended.',
    DUPLICATE_USERNAME: 'That username is already taken in this room.',
    NOT_HOST: 'Only the host can do that.',
    GAME_IN_PROGRESS: 'The game has already started.',
  }
  ```

**404 page** — for unknown routes, link back to home.

---

## 4.7 Security / Validation Hardening

### Backend (final pass)
- All socket payloads: destructure only known fields, ignore extras
- `correctChars` must be integer, not float
- `gameId` must match room the socket is joined to
- `playerId` must exist in room
- Username: strip HTML-special chars (`<`, `>`, `&`, `"`, `'`)
- Rate-limit `session:create` via simple per-IP counter (basic, no Redis needed for MVP)

### Frontend
- Never trust socket data blindly — validate shape before rendering
- Don't display raw `playerId` values anywhere

---

## 4.8 Analytics Events (lightweight)

**`server/utils/analytics.js`**

Simple console.log wrapper for now (replace with real analytics later):
```js
track('room_created', { gameId })
track('room_joined', { gameId, playerCount })
track('round_started', { gameId, roundNumber })
track('round_finished', { gameId, roundNumber, winnerTimeMs, playerCount })
track('session_ended', { gameId, totalRounds })
track('player_disconnected', { gameId, reconnected: false })
```

Called at relevant points in socket handlers.

---

## 4.9 Final File Checklist

### Server files to exist after all phases
```
server/
  config/
    env.js
  controllers/
    sessionController.js
  middleware/
    errorHandler.js
    validatePayload.js
  models/
    Session.js
  routes/
    sessions.js
  sockets/
    index.js
    handlers/
      sessionHandler.js
      roundHandler.js
      playerHandler.js    ← disconnect/reconnect
  utils/
    broadcastManager.js
    reconnectManager.js
    roomStore.js
    roundEnd.js
    sessionHelpers.js
    textPool.js
    updateLeaderboard.js
    analytics.js
  app.js
  server.js
  .env
  .env.example
  package.json
```

### Client files to exist after all phases
```
client/src/
  app/
    store.js
  components/
    lobby/
      HostControls.jsx
      PlayerList.jsx
      SharePanel.jsx
    race/
      CountdownOverlay.jsx
      RaceLane.jsx
      RaceTrack.jsx
      TextDisplay.jsx
      TypingInput.jsx
    results/
      HostResultsControls.jsx
      RoundHistory.jsx
      RoundStandings.jsx
      SessionLeaderboard.jsx
      WinnerBanner.jsx
    shared/
      ConnectionStatus.jsx
      CreateGameModal.jsx
      ErrorToast.jsx
      JoinGameModal.jsx
  features/
    session/
      sessionSlice.js
  hooks/
    useGameSocket.js
    useProgressEmit.js
    queries/
      useSession.js
  pages/
    Home.jsx
    GameLobby.jsx
    GameRace.jsx
    GameResults.jsx
    SessionEnd.jsx
    NotFound.jsx
  routes/
    AppRoutes.jsx
  services/
    api.js
    socket.js
  utils/
    progressCalc.js
  main.jsx
  App.jsx (simplified — just routes)
```

---

## Phase 4 Acceptance Criteria

- [ ] Player who disconnects mid-race re-joins within 25s and resumes from correct state
- [ ] Player disconnected after 25s is marked DNF in results
- [ ] Host disconnecting and not returning causes auto-promotion of next player
- [ ] Empty lobby after a round automatically ends the session
- [ ] Paste in typing input is blocked on both desktop and iOS
- [ ] Layout doesn't break when mobile keyboard opens
- [ ] Avatar movement is smooth (no jitter/jump) at 100ms update intervals
- [ ] Unknown error codes show a generic friendly message
- [ ] Joining a non-existent or ended room shows error and redirects home
- [ ] Restart spam is debounced — double-tap doesn't trigger two rounds
