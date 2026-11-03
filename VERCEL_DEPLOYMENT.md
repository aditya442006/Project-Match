# Deployment

ProjectMatch currently supports authentication only: signup, email verification, login, password recovery/reset, and a protected account page. Its Express server exposes the auth API and serves the built frontend. Matching, teams, projects, chat, and other app-data features are not enabled.

## Recommended: deploy the full app on Render

Create a Node web service for this repository:

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Health check path:** `/health`

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Public frontend origin, e.g. `https://your-service.onrender.com` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public anon/publishable key for the same Supabase project |
| `VITE_API_URL` | `https://your-service.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Same public anon/publishable key |

The `VITE_*` variables are used at build time, so redeploy after changing them. Do not add a Supabase service-role/secret key. The server does not use or require the `project_match_state` table.

In Supabase, enable Auth email confirmation if desired, allow the deployed site's URL in Auth redirect settings, and ensure the `public.profiles` table and profile-creation trigger exist.

## Optional: host the frontend on Vercel

The Express API still needs a persistent Node host such as Render. Import the repository into Vercel with:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set `VITE_API_URL` to the Render API URL and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the same Supabase project used by the backend. On Render, set `CLIENT_URL` to the exact Vercel site origin and redeploy so CORS allows it. Add the Vercel site URL to Supabase Auth's allowed redirect URLs.

For an easier initial deployment, use the single Render service so the frontend and API share an origin.
