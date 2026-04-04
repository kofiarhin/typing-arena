# Testing Gaps

Zero test coverage. Required by CLAUDE.md stack conventions.

---

## Backend Tests (Jest + Supertest)

### `server/utils/` unit tests
| File | Tests needed |
|---|---|
| `sessionHelpers.js` | `generateGameId` — format/uniqueness; `sanitizeUsername` — accepts valid, rejects too short/long/special; `buildSessionUpdate` — strips socketId from output |
| `textPool.js` | `getRandomText` — returns non-empty string |
| `updateLeaderboard.js` | Win increment, roundsPlayed increment, averageTimeMs calc, sort order |
| `progressCalc.js` (if server-side copy exists) | Sequential char validation |
| `roundEnd.js` | `endRound` — correct DNF assignment, winner detection, leaderboard update |

### Socket handler integration tests
These require a test Socket.IO server and client:

| Scenario | Expected |
|---|---|
| `session:create` with valid username | Emits `session:created` with gameId, creates DB record |
| `session:create` with invalid username | Emits `error` INVALID_USERNAME |
| `session:join` existing lobby | Emits `session:joined`, broadcasts `session:update` |
| `session:join` ended room | Emits `error` ROOM_ENDED |
| `session:join` duplicate username | Emits `error` DUPLICATE_USERNAME |
| `round:start` by non-host | Emits `error` NOT_HOST |
| `round:start` with 1 player | Emits `error` NOT_ENOUGH_PLAYERS |
| `round:start` valid | Emits `countdown:start`, transitions to in_progress after 3s |
| `round:progress` correct completion | Assigns rank, triggers `endRound` if all finish |
| `round:progress` monotonic check | Rejects decrease in correctChars |
| `round:restart` by host in round_results | Starts new countdown |
| `round:restart` by host in lobby | Emits `error` INVALID_STATE |
| `session:end` by host | Broadcasts status=ended, disconnects all |
| Disconnect + reconnect within grace | Restores player state |
| Disconnect host, no other players | Session ends |
| Disconnect host, other players active | Promotes new host |

### REST endpoint tests (Supertest)
| Endpoint | Test |
|---|---|
| `GET /api/sessions/:gameId` | Returns session data for valid ID |
| `GET /api/sessions/invalid` | Returns 404 |
| `GET /api/sessions/:ended` | Returns 404 or error |
| `POST /api/sessions/:gameId/end` | Returns 200, marks session ended |

---

## Frontend Tests (Vitest + React Testing Library)

Tests live under `client/test/`.

### Unit tests
| File | Tests needed |
|---|---|
| `utils/progressCalc.js` | Counts consecutive correct chars; stops at first mismatch; handles empty string; handles full match |

### Component tests
| Component | Tests needed |
|---|---|
| `components/shared/CreateGameModal` | Renders form; validates empty username; validates short username; emits `session:create` on valid submit |
| `components/shared/JoinGameModal` | Disables submit when room error present; emits `session:join` on valid submit |
| `components/race/TextDisplay` | Correct chars shown in green; cursor position highlighted; error char shown in red |
| `components/race/RaceTrack` | Renders one lane per player; local player gets optimistic progress |
| `components/lobby/HostControls` | "Start Game" disabled with <2 players; hidden when not host |
| `components/results/SessionLeaderboard` | Renders rows for each player; highlights local player |

### Page integration tests
| Page | Tests needed |
|---|---|
| `Home.jsx` | "Create Game" button opens modal; join form navigates on submit |
| `GameRace.jsx` | Input disabled during countdown; input enabled on `phase === "racing"`; paste is blocked |
| `GameResults.jsx` | Shows "Loading results..." when no data; renders winner banner when results present |

---

## Test Setup Required

### Backend
```bash
npm install --save-dev jest supertest socket.io-client
```

Add to root `package.json`:
```json
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/server/**/*.test.js"]
}
```

### Frontend
```bash
cd client && npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

`client/vite.config.js` needs test config:
```js
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./test/setup.js"],
}
```

Create `client/test/setup.js`:
```js
import "@testing-library/jest-dom";
```
