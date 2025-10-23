Vercel deployment notes
=======================

This repo contains two apps:

- `apps/storefront` — Vite + React frontend (recommended for Vercel static hosting)
- `apps/api` — Express + MongoDB backend (deploy separately, recommended using a server host or Vercel Serverless Functions with a different setup)

Recommended approach
--------------------

1. Deploy the frontend (`apps/storefront`) to Vercel as a static site.
   - Set the build command to: `pnpm install && pnpm run build` (or `npm install && npm run build`)
   - Set the output directory to `apps/storefront/dist` (Vite default is `dist`).

2. Host the API separately. Options:
   - Deploy to a dedicated server or platform with long-running Node processes (recommended) and set `MONGO_URI`, `JWT_SECRET`, etc.
   - Use a serverless platform (Vercel functions or Cloud Run) but ensure Mongo connection reuse and cold-start considerations are handled.

Required environment variables for production
-------------------------------------------

- `MONGO_URI` — MongoDB connection string for your production DB.
- `JWT_SECRET` — Secret used to sign JWT tokens (strong random value).
- `PORT` — If hosting the API on a custom host (default 3001 in dev). Not required for Vercel functions.
- `ORDER_AUTO_PROGRESS` — (optional) set to `true` for demo auto-progression of order status; leave unset or `false` in production.

Optional but helpful
--------------------

- `ORDER_DEBUG` — enable verbose server logs for debugging (do not enable in production).

Notes
-----

- The repository currently contains both apps in `apps/` for local development. For Vercel, it's often simpler to deploy only the frontend and point its VITE_API_URL to your deployed API endpoint.
- If you prefer a single Vercel project to serve both, you'll need to convert the API into serverless functions and adjust `apps/api` build scripts accordingly.

If you want, I can:

- Add a small `vercel.json` customizing builds/routes (I added a minimal one in the repo).
- Provide exact environment variable values you need to set in the Vercel dashboard and a sample for `VITE_API_URL`.
