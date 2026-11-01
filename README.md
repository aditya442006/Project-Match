# ProjectMatch - Student Project & Team Formation Platform

ProjectMatch is an AI-powered student collaboration and team formation web application where college students create skill-rich profiles, receive AI-recommended teammates with complementary skill sets, form teams for projects and hackathons, and collaborate in real-time workspaces with chat, Kanban task boards, notifications, and peer ratings.

---

## Documentation Quick Links
- **[START.md](./START.md)**: Local setup guide & end-to-end verification script.
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**: Full guide to deploying frontend and backend to Vercel and production custom domains.

---

## Architecture Overview
 
 ```
                                    ┌────────────────────────┐
                                    │      Client Browser    │
                                    │ React SPA + TanStack Q │
                                    └───────────┬────────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          │                                           │
                          ▼                                           ▼
          HTTPS REST API (/api/v1/*)                  Socket.IO Gateway (Handshake Auth)
          Auth, Users, Skills, Projects,              Real-time Chat, Typing Indicators,
          Matching, Tasks, Ratings, Admin             Kanban Task Events, Notifications
                          │                                           │
                          └─────────────────────┬─────────────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │   Express + Socket.IO  │
                                    │        Server.ts       │
                                    └───────────┬────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │    Supabase Postgres   │
                                    │  Auth & Seeded Datadb  │
                                    └────────────────────────┘
 ```

### Included Backend Server Components
- **Express Backend Server** (`server/app.ts` & `server.ts`): Fully working REST server mounted at `/api/v1/*`.
- **Socket.IO Real-Time Server** (`server/sockets/index.ts`): Handshake auth verification, rooms (`user:${id}`, `conversation:${id}`, `team:${id}`), typing broadcast, real-time message delivery, and Kanban task drag events.
- **Database & Taxonomy Configuration** (`server/config/db.ts`): Supabase client initialization + persistent in-memory database pre-seeded with real college skills, demo students, projects, teams, and task boards.
- **Role-Based Access Control** (`server/middleware/auth.ts`): In-memory JWT access token rotation, httpOnly `pm_refresh` cookie, `requireAuth` and `requireRole('admin')` guards.

### Environment Variables
Configure `.env` using `.env.example`:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for REST API endpoints (`withCredentials: true`) | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Server URL for WebSocket connection | `http://localhost:5000` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://yxlijrdavohgigtlbmpl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | Public key only (never service_role) |

---

## Authentication Flow

1. **Signup**:
   - `POST /auth/signup` with `{ email, password, name, college?, branch?, year? }`.
   - Creates the Supabase Auth user. A DB trigger inserts `public.profiles` with `id = auth.users.id`.
   - User is redirected to `/verify-email?email=...`.

2. **Login & Session Management**:
   - `POST /auth/login` with `{ email, password }` returns `{ session: { access_token, ... }, user, email_verified }`.
   - The refresh token is set as an `httpOnly` cookie (`pm_refresh`) by the server.
   - The `access_token` lives **IN MEMORY ONLY** in Zustand `authStore` (never stored in `localStorage` or `sessionStorage`).

3. **Silent Token Refresh & Single-Flight Queue**:
   - Every outgoing request sends `Authorization: Bearer <access_token>`.
   - On a `401 Unauthorized` response (except for `/auth/*`), the Axios interceptor holds incoming requests in a single-flight queue.
   - It fires `POST /auth/refresh` once using the `httpOnly` cookie, receives the fresh access token, updates `authStore`, and automatically replays all queued requests with the updated token.
   - If the refresh fails with 401, all queued requests are rejected, `authStore` is cleared, and the user is redirected to `/login?next=<current_path>`.

4. **Multi-Tab Sync**:
   - Logout broadcasts `auth:logout` over a native `BroadcastChannel`, immediately signing out all open browser tabs and terminating active Socket.IO connections.

---

## Troubleshooting Guide

| Error Code | HTTP Status | Root Cause | Frontend Resolution |
| :--- | :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Expired in-memory access token or invalidated session | Triggers single-flight `POST /auth/refresh`. If refresh fails, clears in-memory auth store and redirects to `/login?next=...`. |
| `FORBIDDEN` | `403` | User lacks permission (e.g. non-admin accessing `/admin` or non-team member accessing workspace) | Redirects to `/403` page or displays permission alert. |
| `ROLE_FULL` | `409` | All slots for the requested role were filled before request acceptance | Displays inline warning banner and refetches the latest project role counts. |
| `RATE_LIMITED` | `429` | High volume of matching or auth requests | Shows rate-limit toast notification with retry cooldown timer. |
| `VALIDATION_ERROR` | `422` | Invalid input payload schema | Mapped automatically via `mapServerErrorsToForm` to inline `react-hook-form` field errors. |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite
npm test

# 3. Start development server
npm run dev
```
