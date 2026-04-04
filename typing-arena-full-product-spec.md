# Typing Arena — Full Product Spec

## 1. Product Summary

**Typing Arena** is a mobile-first, real-time multiplayer typing race game where players join a shared room, type the same text at the same time, and watch their avatars race across a track in live sync. The product is designed for fast social gameplay, low join friction, and replayability across multiple rounds.

Primary experience:
- Host creates a room
- Link + QR code are generated
- Players join lobby
- Host starts match
- Synced countdown runs
- Everyone types the same text
- Avatars move in real time based on correct progress
- Winner is declared
- Round results show immediately
- Session leaderboard and round history persist until session ends

---

# 2. Goals

## 2.1 Product Goals
- Create a fun, fast multiplayer typing game
- Optimize for mobile devices first
- Make joining frictionless through shareable URL and QR code
- Show real-time competitive feedback clearly
- Support multiple rounds in one session
- Preserve round history and cumulative leaderboard during a session

## 2.2 Business / Product Value
- Easy viral/social sharing
- Suitable for casual play and classroom/friend group use
- Strong engagement loop through restarts and leaderboard rivalry
- Expandable into public matchmaking, tournaments, and profiles later

---

# 3. Non-Goals for MVP
- Global account system
- Public matchmaking
- Voice chat
- Custom avatar builder
- Spectator mode
- Anti-bot system beyond basic validation
- Complex power-ups
- Native mobile app
- Payment or monetization

---

# 4. Core User Stories

## 4.1 Host
- As a host, I want to create a game quickly so others can join instantly
- As a host, I want a QR code and URL so I can share the room easily
- As a host, I want to see who joined before starting
- As a host, I want to start the game only when ready
- As a host, I want to restart the game with the same group
- As a host, I want to end the session completely

## 4.2 Player
- As a player, I want to join with only a username
- As a player, I want to know when the game is about to start
- As a player, I want typing progress to feel responsive
- As a player, I want to see who is leading in real time
- As a player, I want immediate results for the round
- As a player, I want to see the cumulative leaderboard for the session

---

# 5. Primary Game Flow

## 5.1 Create Room
1. User lands on home page
2. User taps **Create Game**
3. User enters username
4. Backend creates session with:
   - `gameId`
   - host player
   - lobby status
5. Frontend displays:
   - room URL
   - QR code
   - lobby player list
   - host controls

## 5.2 Join Room
1. Player opens shared link or scans QR code
2. App loads room
3. Player enters username
4. Backend validates room availability
5. Player joins lobby
6. All current players in lobby update in real time

## 5.3 Lobby
- Players wait in lobby
- Host sees joined players
- Host can start match
- Optional future ready-state can be added, but not required for MVP

## 5.4 Countdown
1. Host taps **Start Game**
2. Server generates selected round text and round metadata
3. Server broadcasts countdown state
4. All clients render:
   - `3`
   - `2`
   - `1`
   - `GO`
5. Input unlocks only on `GO`

## 5.5 Active Race
1. Players type into controlled input
2. Client calculates correct sequential progress
3. Client sends progress updates to server
4. Server validates and broadcasts sanitized player positions
5. Avatars move on track in real time
6. First valid finisher wins
7. Match ends when:
   - all active players finish, or
   - result timeout passes after first finisher

## 5.6 Results
Immediately after round end:
- Winner banner
- Ranked finish order
- Each player’s completion time
- Session leaderboard
- Round history

## 5.7 Restart or End
- Host can restart a new round with same lobby/session
- Host can end session and destroy room

---

# 6. Information Architecture / Screens

## 6.1 Home Screen
Purpose: create or join a game

Elements:
- App name/logo
- Create Game button
- Join Game input/button (optional direct room ID entry)
- Short explanation
- Mobile-first large CTA buttons

## 6.2 Create Game Modal / Screen
Fields:
- Username

Actions:
- Create

Validation:
- Required
- Max length
- Strip unsafe characters
- No whitespace-only names

## 6.3 Lobby Screen
Elements:
- Room code / room URL
- QR code
- Copy link button
- Share button
- Player list
- Host badge
- Waiting indicator
- Start Game button (host only)
- Leave lobby button

## 6.4 Countdown Overlay
Elements:
- Fullscreen number or animation
- Locked input
- Track visible behind overlay

## 6.5 Race Screen
Elements:
- Round number
- Text prompt
- Live track
- Player avatars
- Leader highlight
- Typing input
- Accuracy/progress indicator
- Optional personal stats:
  - correct chars
  - progress %
  - WPM
- Connection status badge

## 6.6 Round Results Screen
Elements:
- Winner banner
- Per-round ranked results
- Completion times
- Session leaderboard
- Round history
- Restart button (host)
- End game button (host)
- Waiting label for non-host while host decides

## 6.7 Session End Screen
Elements:
- Final session champion
- Final leaderboard
- Full round history
- Exit to home

---

# 7. Functional Requirements

## 7.1 Room Creation
System must:
- Create a unique room/session ID
- Mark creator as host
- Create shareable URL
- Generate QR code from room URL
- Persist session state server-side

## 7.2 Room Join
System must:
- Allow joining by URL
- Validate room exists
- Prevent joining ended room
- Add player to session
- Broadcast updated lobby roster

## 7.3 Usernames
Rules:
- Unique within current room session
- Length limit, e.g. 2–20 chars
- Allow alphanumeric + basic punctuation only
- Trim whitespace
- Case-insensitive duplicate check recommended

## 7.4 Match Start
Only host can:
- Start next round
- Trigger countdown
- Trigger text selection/loading

## 7.5 Text Prompt
For MVP:
- Use preloaded text snippets
- Same text for all players in round
- Text length should be reasonable for mobile:
  - short: 80–120 chars
  - medium: 120–220 chars

Future:
- difficulty levels
- themed packs
- generated text

## 7.6 Typing Rules
- Only correct sequential characters count
- Progress is based on number of correct chars typed in order
- Incorrect characters do not advance player
- Player must correct mistakes before progressing
- Pasting should be blocked or neutralized
- Autocomplete/autocorrect should be minimized on mobile input

## 7.7 Progress Calculation
Canonical formula:
```txt
progress = correctChars / totalChars
```

Avatar X position:
```txt
x = trackWidth * progress
```

## 7.8 Winner Determination
Winner = first player whose validated progress reaches 100%

Tie-breaker:
- Use server receipt timestamp of final valid completion event
- If identical to same millisecond, use deterministic ordering:
  - earliest server-validated final-char event sequence
  - fallback: player join order

## 7.9 Results
Immediate round results must show:
- Winner
- Rank order
- Completion time for each finished player
- DNF status for unfinished players if round is closed before all finish

## 7.10 Session Leaderboard
Track across rounds:
- total wins
- total rounds played
- average completion time
- best completion time
- podium counts (optional)

Sort order:
1. wins descending
2. average time ascending
3. best time ascending

## 7.11 Round History
Display list:
- Round number
- Text length or difficulty label
- Winner
- Winning time
- Date/time if needed

## 7.12 Restart
Restart:
- keeps same players
- keeps session leaderboard
- adds new round record
- resets per-round state

## 7.13 End Session
End session:
- closes room
- disconnects or redirects players
- preserves session data if persistence is enabled
- clears active in-memory game state

---

# 8. Real-Time Behavior Spec

## 8.1 Transport
Use **Socket.IO** over WebSockets

## 8.2 Real-Time Principles
- Server authoritative for round state
- Client computes provisional local progress for immediate UI
- Server confirms and broadcasts canonical state
- UI should reconcile smoothly if server differs

## 8.3 Update Frequency
Recommended:
- Emit progress updates on meaningful changes only
- Debounce/throttle to around 50–100ms
- Avoid emitting on every raw keystroke if noisy

## 8.4 Realtime Visible Data
All players should see:
- current progress of each player
- who is leading
- who has finished
- disconnect/reconnect status if relevant

---

# 9. Socket Event Spec

## 9.1 Client -> Server

### `session:create`
Payload:
```json
{
  "username": "Kofi"
}
```

Response:
```json
{
  "gameId": "AB12CD",
  "playerId": "p1",
  "hostId": "p1",
  "joinUrl": "/game/AB12CD"
}
```

### `session:join`
Payload:
```json
{
  "gameId": "AB12CD",
  "username": "Amara"
}
```

### `session:leave`
Payload:
```json
{
  "gameId": "AB12CD",
  "playerId": "p2"
}
```

### `round:start`
Payload:
```json
{
  "gameId": "AB12CD",
  "playerId": "p1"
}
```

### `round:progress`
Payload:
```json
{
  "gameId": "AB12CD",
  "playerId": "p2",
  "correctChars": 57,
  "inputLength": 60,
  "clientTime": 1710000000000
}
```

### `round:finish`
Optional explicit event if using separate finish signal:
```json
{
  "gameId": "AB12CD",
  "playerId": "p2",
  "correctChars": 120
}
```

### `round:restart`
Payload:
```json
{
  "gameId": "AB12CD",
  "playerId": "p1"
}
```

### `session:end`
Payload:
```json
{
  "gameId": "AB12CD",
  "playerId": "p1"
}
```

### `player:heartbeat`
Optional:
```json
{
  "gameId": "AB12CD",
  "playerId": "p2"
}
```

## 9.2 Server -> Client

### `session:created`
### `session:joined`
### `session:update`
Current session/lobby snapshot:
```json
{
  "gameId": "AB12CD",
  "status": "lobby",
  "players": [
    {
      "playerId": "p1",
      "username": "Kofi",
      "isHost": true,
      "isActive": true
    }
  ]
}
```

### `countdown:start`
```json
{
  "gameId": "AB12CD",
  "roundNumber": 1,
  "countdownSeconds": 3,
  "startsAt": 1710000005000,
  "text": "The quick brown fox jumps over the lazy dog."
}
```

### `round:update`
Canonical race state:
```json
{
  "gameId": "AB12CD",
  "roundNumber": 1,
  "players": [
    {
      "playerId": "p1",
      "username": "Kofi",
      "progress": 0.72,
      "correctChars": 72,
      "finished": false,
      "finishTimeMs": null,
      "rank": null
    }
  ],
  "leaderPlayerId": "p1"
}
```

### `round:finished`
```json
{
  "gameId": "AB12CD",
  "roundNumber": 1,
  "winner": {
    "playerId": "p1",
    "username": "Kofi",
    "timeMs": 25432
  },
  "results": [
    {
      "playerId": "p1",
      "username": "Kofi",
      "position": 1,
      "timeMs": 25432,
      "status": "finished"
    },
    {
      "playerId": "p2",
      "username": "Amara",
      "position": 2,
      "timeMs": 27910,
      "status": "finished"
    }
  ],
  "leaderboard": [],
  "history": []
}
```

### `player:disconnected`
### `player:reconnected`
### `error`
```json
{
  "code": "ROOM_NOT_FOUND",
  "message": "This game does not exist."
}
```

---

# 10. State Machine Spec

## 10.1 Session States
- `lobby`
- `countdown`
- `in_progress`
- `round_results`
- `ended`

## 10.2 Allowed Transitions
- `lobby -> countdown`
- `countdown -> in_progress`
- `in_progress -> round_results`
- `round_results -> countdown` (restart/new round)
- `round_results -> ended`
- `lobby -> ended`

## 10.3 Invalid Actions
- start round if not host
- start round with fewer than minimum players if minimum enforced
- join ended room
- restart if session not in round_results
- send progress when round is not active

---

# 11. Timing and Scoring Spec

## 11.1 Start Time
- Server defines official round start time
- Clients unlock input based on synced countdown end

## 11.2 Finish Time
```txt
finishTimeMs = serverFinishTimestamp - roundStartTimestamp
```

## 11.3 Rankings
Per round:
- sort by finished ascending time
- unfinished players appear below finished players
- DNF last

## 11.4 Session Leaderboard Stats
Each player stores:
- wins
- roundsPlayed
- totalTimeMs
- averageTimeMs
- bestTimeMs

---

# 12. UI / Interaction Spec

## 12.1 Visual Style
- Mobile-first
- High contrast
- Clear racing metaphor
- Minimal clutter
- Touch-friendly targets
- Fast visual read of who is winning

## 12.2 Track Design
Each player occupies one lane:
- lane row
- avatar at current X position
- username label
- lane progress line/background
- finish line marker on right

Recommended:
- stacked vertical lanes on mobile
- leader lane highlighted
- optional crown icon beside leading avatar

## 12.3 Text Display
Show:
- target text in readable block
- current character position highlight
- correct typed portion styled differently
- mistakes clearly visible but not overwhelming

## 12.4 Input
Requirements:
- mobile keyboard optimized
- autocorrect disabled
- autocomplete disabled
- spellcheck off
- paste blocked
- one main input field only

## 12.5 Immediate Feedback
As user types:
- local avatar moves instantly
- progress percent updates
- maybe small “mistake” state if wrong character typed

## 12.6 Results UI
Top section:
- winner card

Middle:
- round standings table/list

Bottom:
- session leaderboard
- round history
- host controls

---

# 13. Mobile-First Requirements

## 13.1 Layout
- Single column by default
- Large readable text
- Large touch targets
- Avoid side-by-side dense tables on small screens
- Use cards/lists for results instead of wide table when needed

## 13.2 Keyboard Considerations
- Input must stay visible when keyboard opens
- Race track must remain partially visible
- Avoid layout jump on focus

## 13.3 QR Join
- QR code displayed prominently in lobby
- Copy link also visible for remote sharing

---

# 14. Data Model Spec

## 14.1 Session Model
```js
{
  _id,
  gameId: String,
  status: 'lobby' | 'countdown' | 'in_progress' | 'round_results' | 'ended',
  hostPlayerId: String,
  createdAt: Date,
  endedAt: Date | null,
  currentRoundNumber: Number,
  players: [PlayerSessionSnapshot],
  leaderboard: [LeaderboardEntry],
  rounds: [RoundRecord]
}
```

## 14.2 Player Session Snapshot
```js
{
  playerId: String,
  username: String,
  socketId: String,
  isHost: Boolean,
  isActive: Boolean,
  joinedAt: Date,
  disconnectedAt: Date | null
}
```

## 14.3 Round Record
```js
{
  roundNumber: Number,
  text: String,
  textLength: Number,
  startedAt: Date,
  endedAt: Date,
  winnerPlayerId: String,
  winnerUsername: String,
  winnerTimeMs: Number,
  results: [
    {
      playerId: String,
      username: String,
      position: Number | null,
      timeMs: Number | null,
      status: 'finished' | 'dnf' | 'disconnected'
    }
  ]
}
```

## 14.4 Leaderboard Entry
```js
{
  playerId: String,
  username: String,
  wins: Number,
  roundsPlayed: Number,
  totalTimeMs: Number,
  averageTimeMs: Number | null,
  bestTimeMs: Number | null
}
```

## 14.5 Optional Separate Active Room Store
For active gameplay, use Redis or memory for speed. Persist summaries to MongoDB after rounds/session end.

---

# 15. Backend Rules and Validation

## 15.1 Server Authority
Server must control:
- room existence
- host permissions
- session state transitions
- round start timestamp
- winner validation
- final rankings

## 15.2 Validation Rules
Validate:
- username format
- room state before join
- room state before progress
- host authority before start/restart/end
- progress monotonic increase
- correctChars not greater than text length

## 15.3 Anti-Cheat Basics
For MVP:
- do not trust arbitrary 100% finish payload without progression consistency
- validate final correct char count equals text length
- optionally reject impossible leaps in progress if they occur too fast
- server should compare reported correctChars against last known state

---

# 16. Edge Cases Spec

## 16.1 Player Disconnects in Lobby
- Mark inactive
- Keep in room briefly
- If reconnect within grace period, restore
- Host can still start or remove later in future version

## 16.2 Player Disconnects Mid-Race
Options for MVP:
- mark as disconnected
- allow reconnect before race ends if grace period remains
- if not returned, result status becomes `disconnected` or `dnf`

## 16.3 Host Disconnects
MVP options:
1. Pause session briefly and allow host reconnect
2. Reassign host automatically to oldest active player after timeout

Recommended:
- 20–30 second host reconnect grace
- then auto-promote next active player

## 16.4 Duplicate Username Join
- reject with user-friendly error
- prompt for another name

## 16.5 Room Not Found
- show error
- return to home

## 16.6 Start With One Player
Decision needed.

Recommended:
- minimum 2 players for race mode

## 16.7 Empty Lobby After Round
- end session automatically

## 16.8 Late Progress After Round End
- ignore progress events once session state leaves `in_progress`

## 16.9 Player Finishes While Network Is Delayed
- server timestamp on receipt is source of truth
- client may briefly show local finish, then reconcile final order

## 16.10 Restart Spam
- only host
- only in `round_results`
- debounce button server-side

---

# 17. Performance Requirements

## 17.1 Target Feel
- realtime updates should feel near-instant
- avatar movement should remain smooth even on average mobile devices

## 17.2 Practical Constraints
- minimize payload size in updates
- throttle progress broadcasts
- avoid rerendering entire page on every state tick
- animate avatar movement with transform, not layout-heavy properties

## 17.3 Scalability for MVP
- rooms are small, e.g. 2–10 players
- session-based low-latency architecture is enough
- MongoDB not needed for every keystroke write

---

# 18. Accessibility Requirements
- keyboard accessible controls
- semantic buttons/inputs
- readable text contrast
- visible focus states
- screen labels for critical actions
- no dependence on color alone to indicate leader/winner
- countdown readable visually

---

# 19. Analytics / Telemetry Events
Track:
- room_created
- room_joined
- round_started
- round_finished
- session_restarted
- session_ended
- player_disconnected
- player_reconnected
- average_round_duration
- abandon_rate_in_lobby

---

# 20. Security / Abuse Considerations
- sanitize usernames
- rate limit room creation/join endpoints if HTTP-backed
- do not expose internal socket IDs publicly
- validate all socket payloads server-side
- prevent oversized payloads
- avoid storing sensitive data unnecessarily

---

# 21. Recommended Tech Architecture

## 21.1 Frontend
- React + Vite
- Tailwind CSS
- Socket.IO client
- TanStack Query for session fetch/bootstrap if REST is used
- Redux Toolkit only for app-level UI/session identity if needed

## 21.2 Backend
- Node.js
- Express
- Socket.IO
- MongoDB + Mongoose
- Redis optional later for active session speed/scaling

## 21.3 Suggested Folder Structure

### client
```txt
client/
  src/
    app/
    components/
      lobby/
      race/
      results/
      shared/
    pages/
      Home.jsx
      GameLobby.jsx
      GameRace.jsx
    routes/
    services/
      socket.js
      gameApi.js
    hooks/
      queries/
      mutations/
    features/
    utils/
  test/
```

### server
```txt
server/
  config/
  controllers/
  models/
    Session.js
  routes/
  sockets/
    handlers/
    index.js
  middleware/
  utils/
```

---

# 22. API / REST Support Spec
Even if sockets handle gameplay, REST can support bootstrap.

## `POST /api/sessions`
Create room

## `GET /api/sessions/:gameId`
Fetch session summary

## `POST /api/sessions/:gameId/join`
Optional pre-socket join

## `POST /api/sessions/:gameId/end`
End session

Sockets remain primary for live race state.

---

# 23. MVP Scope Lock

## Included
- Create room
- Join room via URL
- QR generation
- Lobby
- Host start
- Synced countdown
- Shared text race
- Realtime avatar movement
- Winner + round results
- Session leaderboard
- Round history
- Restart
- End session
- Basic reconnect handling

## Excluded
- user auth
- persistent user profiles
- matchmaking
- public rooms
- friends system
- cosmetics
- tournaments
- chat
- advanced anti-cheat
- spectator mode

---

# 24. Acceptance Criteria

## Room Creation
- Host can create a room with username
- URL and QR are visible immediately

## Join
- Another player can join via link/QR
- Lobby updates live

## Start
- Only host can start
- Countdown is synced for all players

## Race
- Same text appears for all
- Avatars move in real time
- Leading player is visually identifiable

## Finish
- First finisher is winner
- Results appear immediately after round

## Post-Game
- Round results show rankings and times
- Session leaderboard accumulates across restarts
- History shows all rounds played

## Session Controls
- Host can restart or end session
- Restart preserves leaderboard/history
- End session exits room cleanly

---

# 25. Build Order Recommendation

## Phase 1
- room creation/join
- lobby sync
- start game
- countdown

## Phase 2
- shared text rendering
- input validation
- progress logic
- avatar movement

## Phase 3
- winner detection
- round results
- leaderboard
- history

## Phase 4
- restart/end
- reconnect handling
- polish/mobile UX

---

# 26. Open Product Decisions
These are the only remaining choices worth locking:

1. **Minimum players to start**
   - recommended: 2

2. **Round end behavior**
   - recommended: end when all active players finish, or after short timeout after first winner

3. **Text pool**
   - recommended: curated local seed set for MVP

4. **Max room size**
   - recommended: 6–10 players for mobile clarity

5. **Reconnect grace period**
   - recommended: 20–30 seconds

---

# 27. Final Spec Summary

Typing Arena is a **mobile-first, real-time multiplayer typing race game** with:
- room creation
- join by link or QR
- shared lobby
- host-controlled start
- synced countdown
- live avatar racing based on correct typing progress
- immediate round results
- cumulative session leaderboard
- round history
- restart and end session controls

This spec is now detailed enough to move directly into:
- architecture plan
- database schema
- socket contract implementation
- UI wireframes
- full scaffold

Next best step is **MVP technical architecture + folder structure + socket contract implementation plan**.
