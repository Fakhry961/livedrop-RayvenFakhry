# Wiring Vercel (frontend) → Render (backend) using env vars

This repository has a Vite-powered storefront (`apps/storefront`) and an Express API (`apps/api`) intended to run on Render (or any host).

Goal: point the Vercel-built frontend at the deployed Render backend by setting environment variables in both services.

1) Deploy your API to Render (or note its URL)
- On Render create a new Web Service from GitHub, choose the `apps/api` folder if using Monorepo settings.
- Set the Render Environment Variables (Service settings):
  - MONGODB_URI: your MongoDB connection string (Atlas or a managed DB)
  - DB_NAME: optional (defaults to `livedrop`)
  - PORT: optional (Render sets this automatically)
  - LOG_LEVEL: optional
- Deploy and note the public URL Render assigns e.g. `https://livedrop-api.onrender.com`.

2) Set Vercel env var for the storefront
- In Vercel project settings for your frontend (or when creating the project), set the Environment Variable:
  - Key: `VITE_API_URL`
  - Value: `https://livedrop-api.onrender.com` (replace with your Render URL)
  - Apply to: Production (and Preview if you want the same behavior in preview deployments)
- Redeploy the Vercel site so the new VITE_API_URL is embedded at build time.

3) Local development
- For local frontend dev, copy `apps/storefront/.env.example` → `apps/storefront/.env.local` and set:
  - VITE_API_URL=http://localhost:3001
- For the API, either run a local MongoDB or use the in-memory dev script:
  - `pnpm --filter @livedrop/api install && pnpm --filter @livedrop/api run dev:mem`
  - Or start a local Mongo and run `pnpm --filter @livedrop/api start` (after building)

4) CORS considerations
- The API allows CORS by default in `server.ts` via `cors()` which accepts all origins in dev. For production you can set `CORS_ORIGINS` (see `apps/api/.env.example`) and configure the cors options accordingly.

5) DNS / HTTPS
- Vercel and Render provide HTTPS out of the box for their default domains. Use those URLs for `VITE_API_URL`.

6) Quick checklist
- [ ] Deploy `apps/api` to Render and confirm the public URL works (visit `/health`).
- [ ] Set `VITE_API_URL` in Vercel to the Render URL and redeploy the frontend.
- [ ] (Optional) Add `MONGODB_URI` to Render's environment variables and keep secrets out of git.

If you want, I can: 
- Add a small runtime CORS config that reads `CORS_ORIGINS` from env and restricts origins in production.
- Create a `.github/workflows/ci.yml` to automate deploy/checks between Vercel and Render.
