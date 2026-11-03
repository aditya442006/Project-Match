# Quick Start Guide: ProjectMatch

This guide gets your ProjectMatch frontend up and running locally, connected to the backend API, Supabase Auth, and real-time Socket.IO gateway.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or **pnpm** / **yarn**
- **Unified Full-Stack Architecture**: The Express backend, REST API server, and Socket.IO real-time gateway are integrated with the Vite frontend through `server.ts`. Both run together concurrently on a single port (3000 in development).
- **Database Configuration**: Supabase Auth and a persistent Supabase-backed store for skills, student profiles, projects, workspaces, and real-time chat.

---

## 2. Server Architecture & Included Backend Components

The repository includes the complete backend implementation:

| Component | Path | Description |
| :--- | :--- | :--- |
| **Unified Server** | `/server.ts` | Mounts Express, HTTP server, Socket.IO, and Vite middlewares |
| **REST API Server** | `/server/app.ts` | Express application mounting `/api/v1/*` domain routes |
| **Database Config** | `/server/config/db.ts`, `/server/config/persistence.ts` | Supabase client, startup hydration, and persistent application records |
| **Auth & Security** | `/server/middleware/auth.ts` | JWT verification (`requireAuth`, `requireRole`) & token rotation |
| **Socket.IO Server** | `/server/sockets/index.ts` | Handshake auth, rooms (`user:*`, `conversation:*`, `team:*`), real-time chat, typing indicators, and task events |
| **API Domain Routes**| `/server/modules/*` | Auth, Users, Skills, Projects, Teams, Requests, Matching, Chat, Notifications, Tasks, Ratings, Admin |

The repository contains `.env.example` and `.env` configured with your Supabase credentials:

```bash
# Verify or create your local environment file
cp .env.example .env
```

Run [`supabase/migrations/20261103000000_create_project_match_state.sql`](./supabase/migrations/20261103000000_create_project_match_state.sql) in the Supabase SQL Editor, then set the backend-only Supabase variables in your local `.env` and Render:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
```

> Keep `SUPABASE_SECRET_KEY` only in the ignored local `.env` and Render's secret environment variables. Never add it to frontend variables (the `VITE_` prefix) or commit it.

The local frontend and backend share port `3000`; production defaults point to the Render API at `https://project-match-t42v.onrender.com`.

---

## 3. Installation & Local Development

```bash
# Install dependencies
npm install

# Run the Vitest test suite to verify auth store, validators, and API client
npm test

# Launch development server
npm run dev
```

The app will start on:
`http://localhost:3000` (or the port specified by Vite / AI Studio preview).

---

## 4. End-to-End Verification Checkpoint

Follow this flow to verify the full stack:

### Step A: Account Registration
1. Navigate to `/register`.
2. Fill in:
   - **Name**: e.g., `Alex Rivera`
   - **Email**: `alex@university.edu`
   - **Password**: `Password123!` (minimum 8 characters, at least 1 letter and 1 digit)
   - **Academic Details**: College name, major branch, and study year (1–6).
3. Click **Create Account**.
4. You will be redirected to `/verify-email?email=alex@university.edu`.

### Step B: Email Verification
- Click **"I've verified my email"** once you have confirmed the verification link in your email.
- Or use the **"Resend verification email"** button (equipped with a 60-second cooldown timer).

### Step C: Log In & Session Retention
1. Log in at `/login`.
2. Notice your greeting, profile completeness ring, and recommended teammate feed on `/dashboard`.
3. Perform a **hard page refresh** (`Ctrl+F5` / `Cmd+Shift+R`):
   - Notice the non-blocking *"Restoring session..."* skeleton appear.
   - The app automatically runs `POST /auth/refresh` using the `httpOnly` cookie and restores your in-memory session seamlessly.

### Step D: Cross-Tab Logout
1. Open ProjectMatch in two browser tabs.
2. Click **Sign Out** in the first tab.
3. The native `BroadcastChannel('projectmatch_auth')` broadcasts `auth:logout` across all tabs, instantly redirecting all tabs to `/` and closing the Socket.IO connection.

---

## 5. Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server with hot reload |
| `npm run build` | Builds optimized production bundle to `/dist` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript typechecks (`tsc --noEmit`) |
| `npm test` | Runs the Vitest test suite |
