# Quick Start Guide: ProjectMatch

This guide gets your ProjectMatch frontend up and running locally, connected to the backend API, Supabase Auth, and real-time Socket.IO gateway.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or **pnpm** / **yarn**
- **ProjectMatch Backend**: Express + Socket.IO server running (typically on `http://localhost:5000`)
- **Supabase Project**: Initialized project with PostgreSQL database and Supabase Auth

---

## 2. Environment Configuration

The repository contains `.env.example` and `.env` configured with your Supabase credentials:

```bash
# Verify or create your local environment file
cp .env.example .env
```

Your `.env` contains:

```env
# REST API Base URL (must end with /api/v1)
VITE_API_URL=http://localhost:5000/api/v1

# Socket.IO Gateway Server
VITE_SOCKET_URL=http://localhost:5000

# Supabase Auth Configuration (Client-safe public keys only)
VITE_SUPABASE_URL=https://yxlijrdavohgigtlbmpl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76
```

> **Security Rule**: Never add `SUPABASE_SECRET_KEY` or database master passwords to `.env` or client code. The frontend only consumes the public anonymous key. All database mutations happen via the authenticated REST API.

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
