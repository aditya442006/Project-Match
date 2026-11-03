# ProjectMatch

ProjectMatch currently provides account authentication only: registration, email verification, login, password recovery/reset, and a protected account page. Matching, projects, teams, chat, and other app-data features are not enabled.

## Stack

- React, Vite, and TypeScript frontend
- Express API in `server.ts`
- Supabase Auth and the `public.profiles` table

The server exposes authentication at `/api/v1/auth/*` and serves the production frontend. It does not require the `project_match_state` table or a Supabase service-role/secret key.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` to the same Supabase project. The browser key must be a public anon/publishable key.
3. Ensure that project has Supabase Auth enabled and a `public.profiles` table with a profile-creation trigger for new auth users.
4. Install and run:

   ```bash
   npm install
   npm test
   npm run dev
   ```

Visit `http://localhost:3000`.

## Render deployment

Deploy this repository as a Node web service:

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Health check path:** `/health`

Set these environment variables in Render:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | The public site origin, e.g. `https://your-service.onrender.com` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public anon/publishable key for that same project |
| `VITE_API_URL` | `https://your-service.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Same public anon/publishable key |

`VITE_*` values are embedded into the frontend at build time. If you change them in Render, trigger a new deploy. Do not set or expose a Supabase service-role/secret key.

## Authentication setup

Supabase Auth email confirmation should be enabled if you want new users to verify their email before signing in. Add the deployed site URL to Supabase Auth's allowed redirect URLs. Keep the Supabase URL and public key used by the browser and Render backend pointed at the same project.

For Vercel frontend hosting or additional details, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).
