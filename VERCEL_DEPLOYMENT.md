# Deploying ProjectMatch to Vercel & Production

This guide walks you through deploying both the **ProjectMatch React Frontend** and the **Node.js Express + Socket.IO Backend** to achieve a fully working, secure public domain.

---

## 1. Architectural Strategy for Vercel

### Why Frontend on Vercel + Backend on a Container Host?
- **Frontend**: Vercel provides world-class Edge CDN distribution, instant preview URLs, automated SSL certificates, and zero-config caching for Vite/React applications.
- **Backend**: ProjectMatch requires persistent bidirectional WebSocket connections for **Socket.IO** (real-time chat, typing indicators, live task movements, and instant notification pushes). Because Vercel serverless functions are ephemeral and terminate connections after request completion, long-lived WebSockets require a persistent container environment (e.g. **Render**, **Railway**, **Fly.io**, or **AWS ECS**), or a custom domain setup pairing Vercel and your backend.

---

## 2. Frontend Deployment on Vercel

### Step 1: Push to GitHub / GitLab / Bitbucket
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "feat: complete projectmatch frontend and deployment config"
git push origin main
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Select your Git repository.
4. Configure the Build & Development Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables in Vercel
In the **Environment Variables** panel in Vercel, add:

| Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://api.yourdomain.com/api/v1` | Your production backend REST API endpoint |
| `VITE_SOCKET_URL` | `https://api.yourdomain.com` | Your production WebSocket gateway |
| `VITE_SUPABASE_URL` | `https://yxlijrdavohgigtlbmpl.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_8FbmU4dHIrj_IGJncqpRfg_mnA77m76` | Supabase publishable anonymous key |

### Step 4: Verify SPA Rewrites (`vercel.json`)
The project includes `/vercel.json` to handle client-side routing so deep paths like `/teams/123` or `/matching` do not return a 404 on refresh:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Click **Deploy**. Within 60 seconds, your site is live at `https://<your-project>.vercel.app`.

---

## 3. Backend Deployment (Render / Railway / Serverless)

### Option A: Render (Recommended for WebSockets & Easy Setup)
1. Go to [Render.com](https://render.com) and create a **New Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node server.js` / `tsx server.ts`)
   - **Health Check Path**: `/health`
4. In **Environment Variables**, set:
   - `NODE_ENV=production`
   - `PORT=5000` (Render dynamically binds `$PORT`)
   - `CLIENT_URL=https://your-frontend.vercel.app` (or `https://projectmatch.yourdomain.com`)
   - `SUPABASE_URL=https://yxlijrdavohgigtlbmpl.supabase.co`
   - `SUPABASE_SECRET_KEY=sb_secret_Sh4zuCl1hE-ujPRHoWUZzg_81OU7IiD`
   - `SUPABASE_JWKS_URL=https://yxlijrdavohgigtlbmpl.supabase.co/auth/v1/.well-known/jwks.json`
   - `JWT_ACCESS_SECRET=<your-access-secret>`
   - `JWT_REFRESH_SECRET=<your-refresh-secret>`

### Option B: Deploying Backend API to Vercel (Serverless Functions)
If you wish to deploy the Express REST API directly on Vercel alongside the client:
1. Create an `/api/index.ts` handler that exports your Express application:
   ```typescript
   import app from '../server/src/app';
   export default app;
   ```
2. In `vercel.json`, configure routing:
   ```json
   {
     "rewrites": [
       { "source": "/api/v1/(.*)", "destination": "/api/index.js" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. *Note on Socket.IO*: Because serverless functions freeze between requests, real-time events must be routed through a serverless real-time provider (such as Supabase Realtime Channels or Pusher) instead of in-process Socket.IO rooms.

---

## 4. Production Cookie & CORS Settings (Critical)

For the authentication cookie (`pm_refresh`) to work seamlessly between your frontend and backend on public domains:

### Cross-Origin Setup (e.g. `app.vercel.app` + `backend.onrender.com`)
In your backend `app.js`:
```javascript
// Enable trust proxy when behind Vercel / Cloudflare / Render load balancers
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Refresh cookie options for cross-site domains:
res.cookie('pm_refresh', refreshToken, {
  httpOnly: true,
  secure: true,           // Required for HTTPS
  sameSite: 'none',       // Required for cross-domain cookies
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

## 5. Setting Up a Custom Public Domain

To make the app professional (e.g., `app.projectmatch.com` and `api.projectmatch.com`):

### 1. In Vercel (Frontend)
1. Go to **Settings** -> **Domains**.
2. Add your custom domain (e.g., `app.yourdomain.com` or `yourdomain.com`).
3. Add the provided `CNAME` record in your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.):
   - **Type**: `CNAME`
   - **Name**: `app` (or `@` for apex)
   - **Value**: `cname.vercel-dns.com`

### 2. In Backend Host (Backend API)
1. Add custom domain: `api.yourdomain.com`.
2. Add `CNAME` pointing `api` to your backend host URL.

### 3. Benefits of Same First-Party Domain
When frontend is `app.yourdomain.com` and backend is `api.yourdomain.com`:
- Cookies can be set with `domain: '.yourdomain.com'` and `sameSite: 'lax'`, preventing third-party cookie restrictions in Safari and modern browsers!

---

## 6. Pre-Flight Production Checklist

- [x] `vercel.json` added for client-side SPA routing rewrites.
- [x] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured in Vercel environment.
- [x] `VITE_API_URL` and `VITE_SOCKET_URL` pointed to the production HTTPS/WSS backend.
- [x] No sensitive secret keys (`SUPABASE_SECRET_KEY`, database passwords) committed in client repo.
- [x] CORS on the backend explicitly allows the Vercel domain with `credentials: true`.
- [x] Vitest test suite passing (`npm test`).
