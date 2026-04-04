# Deployment Gaps

Everything needed before the app can be deployed and run in production.

---

## 1 — `client/.env.production` is missing

**Status:** File does not exist  
**Impact:** Production Vite build has no `VITE_API_URL` or `VITE_SOCKET_URL`. Both services throw `Error: Missing VITE_* environment variable` at module load time and the app crashes.

**Fix:** Create `client/.env.production`:
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

Alternatively, rely entirely on the deployment platform (Vercel env vars) and omit the file — but only if the Vercel project is configured first.

**Note:** Vite injects `VITE_*` vars at build time. Env vars must exist before `npm run build` runs.

---

## 2 — `server/.env.example` is missing

**Status:** Root `.env.example` exists but there is no `server/.env.example`  
**Impact:** Someone setting up the project won't know what env vars the server needs.

**Fix:** Create `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/typing-arena
CLIENT_URL=http://localhost:5173
```

---

## 3 — No frontend deployment config (`vercel.json`)

**Status:** Not present  
**Impact:** A Vercel deployment of the Vite SPA will return 404 on all routes except `/` because Vercel doesn't know to redirect all paths to `index.html`.

**Fix:** Create `client/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Or create at the root if deploying the whole repo to Vercel with the frontend as the build output.

---

## 4 — No backend deployment config

**Status:** Not present  
**Impact:** Hosting platforms like Render or Railway require either a `Procfile` or an explicit start command. The root `package.json` has a `start` script (`node server/server.js`) which works, but there is no config file to tell platforms the build root is the repo root.

**Fix (Render):** Create `render.yaml` at root:
```yaml
services:
  - type: web
    name: typing-arena-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: CLIENT_URL
        sync: false
      - key: PORT
        value: 10000
```

**Fix (generic):** Ensure the root `package.json` `start` script is correct (it is: `node server/server.js`).

---

## 5 — Server does not exit on missing `MONGODB_URI`

**File:** `server/server.js`  
**Status:** MONGODB_URI is read but the server may start and appear healthy even without a working DB connection.

**Fix:** Add an explicit guard at server startup:
```js
if (!process.env.MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not set. Exiting.");
  process.exit(1);
}
```

This prevents silent DB-less operation in production.

---

## 6 — Root `.gitignore` is too minimal

**Current `.gitignore`:**
```
.env
node_modules
```

**Missing entries:**
- `client/.env.production` — should not be committed (contains prod URLs)
- `client/.env.local` — Vite convention, should be gitignored
- `dist/` — Vite build output
- `client/dist/`

**Fix:** Update root `.gitignore`:
```
.env
.env.local
.env.production
node_modules
dist
client/dist
```

---

## 7 — `client/.env.example` needs `VITE_SOCKET_URL`

**File:** `client/.env.example`  
**Current content (from codebase):** Only shows `VITE_API_URL`  
**Missing:** `VITE_SOCKET_URL` — needed for Socket.IO connection

**Fix:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
