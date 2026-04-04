# CLAUDE.md

## Tech Stack

Use the following stack by default unless the project explicitly requires otherwise.

### Frontend

- React with the latest Vite setup
- JavaScript by default unless TypeScript is explicitly requested
- Tailwind CSS by default
- React Router for routing
- TanStack Query for server state
- Redux Toolkit for global client-side state only
- Axios for HTTP requests when a shared client is needed
- Socket.IO client only when real-time features are required
- Vitest for frontend testing
- React Testing Library for component and UI behavior testing

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Jest for backend testing
- Supertest for API and integration testing
- Socket.IO only when real-time features are required

### Infrastructure and Config

- `.env` for all secrets and environment-dependent configuration
- Root-level `package.json` by default
- Separate `client/` and `server/` directories by default
- Environment-driven API and socket URLs
- Centralized config modules for backend environment access
- Frontend production API base URLs must come from environment variables
- Vite frontend environment variables must use the `VITE_` prefix
- Never hard-code production API URLs inside components or services
- Never rely on Vite dev proxy for production behavior
- Production builds must fail loudly when required environment variables are missing
- Include `.env.example` files for both client and server when environment variables are required

### Styling

- Tailwind CSS is the default styling system
- Use utility classes directly for simple UI
- Extract repeated patterns into reusable components or helpers
- Only use SCSS or CSS Modules if explicitly requested or clearly justified by the project

### Data and State Rules

- TanStack Query manages all server state
- Redux Toolkit manages only global client state
- Do not duplicate backend data into Redux
- Do not place API calls directly inside UI components
- Keep request logic in `services/`

### Testing Rules by Stack

- Vitest only for frontend tests
- Jest only for backend tests
- Supertest for backend HTTP route testing
- Frontend tests should live under `client/test/`
- Add or update tests when behavior changes

### Real-Time Rules

Only use Socket.IO when real-time behavior is part of the requirement, such as:

- chat
- notifications
- live presence
- live game state
- streaming updates

Do not add Socket.IO by default if the feature does not need it.

### Default Project Structure

```txt
package.json
client/
server/
```

### Frontend Default Structure

```txt
client/
  src/
    app/
    components/
    features/
    hooks/
      queries/
      mutations/
    lib/
    pages/
    routes/
    services/
    utils/
  test/
```

### Backend Default Structure

```txt
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
```

### Default Stack Rule

If the user does not specify alternatives, always assume this stack.

Do not switch to Next.js, TypeScript, SCSS, Prisma, Firebase, Zustand, or other alternatives unless explicitly requested or clearly required by the project.

---

## Stack Discipline Rule

Stay consistent with the chosen stack across the project.

- Do not mix conflicting patterns without a clear reason
- Do not introduce alternative state libraries when Redux Toolkit and TanStack Query already cover the need
- Do not introduce alternative styling systems unless requested
- Do not introduce alternative backend frameworks unless requested
- Do not switch tooling mid-project without necessity
- Prefer consistency over novelty

---

## Environment and Deployment Rules

These rules are mandatory for Vite + separate backend deployments.

### Frontend API Base URL Rule

- All frontend API clients must read the API base URL from `import.meta.env`
- Use `VITE_API_URL` as the default frontend API environment variable name
- Do not assume `/api` will work in production unless a real production rewrite is explicitly configured
- Do not depend on local proxy behavior for deployed environments
- For production-ready code, prefer explicit environment-based URLs over implicit proxy assumptions

### Frontend API Client Rule

When creating a shared Axios client for a Vite app, use this pattern by default:

```js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error("Missing VITE_API_URL environment variable");
}

export const api = axios.create({
  baseURL,
});
```

Rules:

- Do not silently fall back to "/api" in production-ready generated code
- Failing fast is preferred over hidden deployment bugs
- If a local-only fallback is used, it must be explicitly labeled as development-only

### Vite Proxy Rule

- Vite `server.proxy` is for local development only
- Never describe Vite proxy as a production solution
- If proxy exists in `vite.config.js`, it should only support local dev against a local backend
- Production API routing must be handled by:
  - environment variables, or
  - explicit platform rewrites such as `vercel.json`

### Vercel Deployment Rule

For frontend deployments on Vercel:

- Use `VITE_API_URL` in Vercel Environment Variables
- Remember that Vite injects `VITE_*` variables at build time, not runtime
- After adding or changing environment variables in Vercel, always trigger a new deployment
- If environment values change, a rebuild is required for the frontend to see them
- Do not assume updating Vercel env vars automatically fixes existing builds

### Separate Frontend and Backend Deployment Rule

When frontend and backend are deployed separately:

- Frontend should call the deployed backend URL via environment config
- Backend should expose stable API routes, such as `/api/...`
- Frontend should not assume backend shares the same origin unless explicitly designed that way
- Keep backend URL, socket URL, and other integration endpoints environment-driven

### Example Environment Files

#### `client/.env.development`

```env
VITE_API_URL=http://localhost:5000/api
```

#### `client/.env.production`

```env
VITE_API_URL=https://your-backend-domain.com/api
```

#### `client/.env.example`

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend CORS Rule

For separated deployments:

- Backend must explicitly allow the frontend origin in CORS
- Do not leave production CORS fully open unless explicitly requested
- Use environment variables such as `CLIENT_URL` for allowed origins
- Keep CORS configuration in backend setup, not scattered across route files

Recommended backend pattern:

```js
app.use(
  cors({
    origin: [process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  }),
);
```

### Deployment Safety Rule

When generating code for deployed apps:

- Never hard-code `localhost` for production paths
- Never assume frontend and backend share the same domain
- Never assume proxy behavior exists outside local development
- Prefer explicit, environment-driven configuration
- Add `.env.example` whenever introducing required environment variables
- For critical required config, fail fast with a clear error

### Debugging Rule for Deployment Issues

When diagnosing frontend-to-backend failures in Vite deployments, check in this order:

1. Is `VITE_API_URL` defined in the deployment platform?
2. Was the frontend rebuilt after the env var was added or changed?
3. Is the deployed frontend calling the correct backend URL?
4. Does the backend route exist?
5. Is CORS allowing the deployed frontend origin?

### Code Generation Rule for Future Projects

Whenever generating frontend service code for a Vite app that talks to a backend:

- Default to `import.meta.env.VITE_API_URL`
- Include a fail-fast guard for missing env vars in production-ready code
- Add example env files
- Do not use "/api" as the only base URL unless the user explicitly says the frontend and backend are hosted together with rewrites configured
