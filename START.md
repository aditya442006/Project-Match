# Quick Start

ProjectMatch is configured for registration, email verification, login, password recovery, and a protected account page. Matching, teams, projects, and chat are not enabled.

## Requirements

- Node.js 20 or newer
- A Supabase project with Auth enabled, a `public.profiles` table, and a trigger that creates a profile when an auth user is registered

## Run locally

1. Copy `.env.example` to `.env`.
2. Set the Supabase URL and public anon/publishable key for the same project in both the `VITE_*` and backend variables.
3. Install dependencies, run tests, and start the app:

   ```bash
   npm install
   npm test
   npm run dev
   ```

Open `http://localhost:3000`.

## Verify authentication

1. Register at `/register` and check your email for the Supabase confirmation link.
2. After confirmation, sign in at `/login`.
3. Confirm the protected `/account` page loads, then sign out.
4. Try `/forgot-password` to test password recovery.

## Deploy on Render

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`

Configure `NODE_ENV=production`, `CLIENT_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Also set `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` for the frontend build. The frontend and backend Supabase values must point to the same project. No `project_match_state` migration or service-role key is needed.
