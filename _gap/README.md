# Gap Analysis — Typing Arena

**Date:** 2026-04-04  
**Status of codebase:** All core files scaffolded. Most game logic implemented. Several critical bugs present. Zero tests. No deployment config. Not yet production-safe.

---

## Priority Tiers

### Tier 1 — Critical (breaks core gameplay)
These are bugs that will cause the game to malfunction for real users.

→ See [`critical-bugs.md`](./critical-bugs.md)

### Tier 2 — Required for Deployment (app won't start or will silently fail in prod)
Missing env files, deployment config, startup guards.

→ See [`deployment-gaps.md`](./deployment-gaps.md)

### Tier 3 — Data / State Integrity (bad UX on real usage)
Page refreshes break the app, data is lost on session end.

→ See [`state-gaps.md`](./state-gaps.md)

### Tier 4 — Security & Robustness
Not blocking for MVP but needed before any public exposure.

→ See [`security-gaps.md`](./security-gaps.md)

### Tier 5 — Tests (required by stack conventions, zero coverage currently)
→ See [`testing-gaps.md`](./testing-gaps.md)

### Tier 6 — Spec Features Not Yet Implemented
Minor UX items from the product spec that are missing or stubbed.

→ See [`spec-gaps.md`](./spec-gaps.md)

---

## Summary Table

| Area | Status | Severity |
|---|---|---|
| `round:restart` logic broken | Bug | Critical |
| `round:finish` handler broken | Bug | Critical |
| Session end — empty data on early exit | Bug | Critical |
| Results page breaks on page refresh | Bug | High |
| `client/.env.production` missing | Missing file | Blocks deployment |
| `server/.env.example` missing | Missing file | Deployment friction |
| Vercel / backend deploy config missing | Missing | Blocks deployment |
| Server startup — no exit on bad MONGO URI | Robustness | High |
| `CLIENT_URL` undefined produces broken `joinUrl` | Bug | High |
| No rate limiting on socket or REST | Security | Medium |
| No socket payload size validation | Security | Medium |
| Zero test coverage | Missing | Required by stack |
| No WPM / accuracy indicators in race | Spec gap | Low (optional per spec) |
| Analytics is console.log only | Stub | Low |
