# LiveDrops (livedrop-RayvenFakhry)

Opinionated starter for a small e‑commerce demo: Vite + React storefront and an Express + MongoDB API.

This repository contains two main apps under `apps/`:

- `apps/storefront` — Vite + React + TypeScript frontend
- `apps/api` — Express + MongoDB backend

This README explains how to run the project locally, seed the database, build for production, and deploy the frontend to Vercel.


## Render Testing (https://livedrop-rayvenfakhry.onrender.com/)

/api/health
/api/products
/api/customers
/api/orders

## Vercel Testing (https://livedrop-rayvenfakhry.vercel.app/)
## Demos email to sign in
drew.kumar297@example.com
rowan.ibrahim585@inbox.test
taylor.hernandez806@inbox.test


## Quick start (local)

Prerequisites

- Node.js >= 18
- pnpm or npm
- A running MongoDB instance (local or remote)

Install dependencies (root workspace)

```bash
# from repository root
npm install
# or, if you prefer pnpm
pnpm install
```

Run the API (dev)

```bash
cd apps/api
# set env vars, then start
set MONGO_URI=mongodb://localhost:27017/livedrop
set JWT_SECRET=replace_this_secret
npm run dev
```

Run the storefront (dev)

```bash
cd apps/storefront
set VITE_API_URL=http://localhost:3001
npm run dev
```

Open `http://localhost:5173` for the storefront UI and `http://localhost:3001` for the API endpoints.

## Seeding the database

The repo includes a seed script to populate `products` and `customers` from the public mock catalog. Run from the API directory:

```bash
cd apps/api
node scripts/seed.js
```

There is also `scripts/seed-from-mock.mjs` and a small utility to help seed in different ways.

## Environment variables

Set the following at minimum for local development:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — API port (optional; default 3001)
- `VITE_API_URL` — Frontend environment variable to point to the API (for build)

Optional (dev/demo):

- `ORDER_DEBUG=1` — Enable verbose server logs (do not enable in production)
- `ORDER_AUTO_PROGRESS=true` — Enable demo auto-progression of order status (PENDING → PROCESSING → SHIPPED → DELIVERED)

## Production / Vercel

Recommended: deploy the frontend (`apps/storefront`) to Vercel and host the API separately (Cloud Run, a VPS, or a Node host). The repo includes a minimal `vercel.json` and `docs/Vercel-deploy.md` with more details.

On Vercel set the following environment variables for the frontend:

- `VITE_API_URL` — e.g. `https://api.example.com`

For the API host set the usual server env vars: `MONGO_URI`, `JWT_SECRET`, and optionally `ORDER_AUTO_PROGRESS` (recommended false in prod).

## CI / Build errors

- If `tsc` complains about unused imports (e.g. `Catalog`), remove the unused import or update `tsconfig.app.json` to relax `noUnusedLocals` (not recommended).
- If TypeScript cannot find CSS imports (e.g. `import './index.css'`), ensure `apps/storefront/src/global.d.ts` is present (this repo includes one) or add `declare module '*.css'` in a global `.d.ts` file.

## Troubleshooting

- CORS / failed fetch: make sure the API CORS allowlist includes your Vite dev origin (e.g. `http://localhost:5173`).
- Mongo connection/refused: verify `MONGO_URI` and that `mongod` is running and reachable.
- Double-decrement of stock: the server aggregates same-SKU lines and only applies fallback decrements when atomic update fails; if you still see duplicates, check for duplicate client POSTs (add idempotency keys) or re-run with `ORDER_DEBUG=1` to inspect logs.

## Next steps / suggestions

- Add an env guard around the demo auto-progress (I can add this quickly) to prevent status auto-advancement in production.
- Add integration tests to assert inventory decrements exactly once per successful order.

If you want, I can also add a small `Makefile` or npm scripts at the repo root to bootstrap both apps for local dev.
# LiveDrops — Flash-Sale & Follow Platform

## 📌 Overview
LiveDrops is a system where creators can run limited-inventory live product drops.  
Users can follow creators, receive near real-time notifications when drops start or stock changes, browse products, and place secure orders without overselling.  

This design prioritizes **scalability**, **low-latency reads**, and **idempotent order handling** to handle sudden traffic spikes from popular creators.

---

## 🖼️ Architecture Diagram
![System Architecture](./LiveDrops-Architecture.png)

*(Diagram exported from [Excalidraw](./LiveDrops-Architecture.excalidraw))*  

---

## 🗂️ Data Model Sketches

### Users & Follows
- **Users**
  - `user_id (PK)`
  - `name`
  - `email`
- **Follows**
  - `follower_id (FK → Users.user_id)`
  - `creator_id (FK → Users.user_id)`
  - Composite PK → (`follower_id`, `creator_id`)

### Creators & Drops
- **Creators**
  - `creator_id (PK)`
  - `profile_name`
- **Drops**
  - `drop_id (PK)`
  - `creator_id (FK → Creators.creator_id)`
  - `product_id (FK → Products.product_id)`
  - `start_time`, `end_time`
  - `stock_count`

### Products & Orders
- **Products**
  - `product_id (PK)`
  - `title`, `description`, `price`
- **Orders**
  - `order_id (PK)`
  - `user_id (FK → Users.user_id)`
  - `drop_id (FK → Drops.drop_id)`
  - `status` (pending, confirmed, failed)
  - `created_at`
  - `idempotency_key` (to prevent duplicates)

---

## 📡 API Contract Outline

### Public API (for mobile/web clients)
- **User / Follow**
  - `POST /users/{id}/follow/{creatorId}`
  - `DELETE /users/{id}/follow/{creatorId}`
  - `GET /users/{id}/following`
  - `GET /creators/{id}/followers`
- **Products / Drops**
  - `GET /products?page=n`
  - `GET /drops/live`
  - `GET /drops/{id}`
- **Orders**
  - `POST /orders`  
    Request includes `drop_id`, `quantity`, `idempotency_key`
  - `GET /orders/{id}`

### Internal APIs / Events
- `drop.started`, `drop.soldout`, `stock.low`, `order.confirmed` → published via **Kafka**.  
- **Notification workers** consume these events to send push notifications in near real time.

---

## ⚡ Caching & Invalidation
- **Redis** used for:
  - Hot product details, stock counts, and creator profiles.
  - Paginated follower lists (sharded to avoid hot-spotting on celebrity creators).
- **Invalidation Strategy**:
  - On stock update or order confirmation → update DB (source of truth), then invalidate Redis cache entry.
  - Write-through cache for product reads.
  - Event-driven invalidation for follower updates.

---

## 🔑 Key Design Decisions & Tradeoffs
- **SQL for Orders & Inventory**  
  Ensures strong consistency and no overselling. Inventory updates use row-level locking or atomic counters.  

- **NoSQL for Follows (sharded by creator_id)**  
  Enables fast fan-out for large celebrity accounts with millions of followers.  

- **Kafka for Event Distribution**  
  Decouples drop/stock/order events from notification delivery and analytics.  

- **Idempotent Orders**  
  `idempotency_key` prevents double orders from retries.  

- **Scalability**  
  - Horizontally scalable stateless API servers behind load balancer.  
  - CDN for static content.  
  - Caching layer reduces DB load.  

- **Reliability**  
  - Notifications guaranteed via retry queues.  
  - Orders never oversell via DB-level constraints.  
  - System resilient to single-node failures.  

---

## 📊 Metrics & Observability
- Track **request volume, latency (p95)**, **cache hit ratio**, **DB lock contention**, **notification delivery times**.  
- Centralized logging and monitoring dashboards (Grafana/Prometheus).  

---

## ✅ Requirements Checklist
- [x] Follows, unfollows, follower list queries  
- [x] Product browsing with pagination  
- [x] Live drop scheduling, stock enforcement  
- [x] Real-time notifications (< 2s)  
- [x] Orders with idempotency and no overselling  
- [x] Low-latency reads (p95 ≤200ms)  
- [x] Order placement ≤500ms  
- [x] Scalability to millions of followers  

---

## 🚀 How to Run
This repo contains:
- `LiveDrops-Architecture.excalidraw` (editable diagram)  
- `LiveDrops-Architecture.png` (export for quick viewing)  
- `README.md` (this document)  

---

## Quick start — run the storefront and Storybook locally

Prerequisites
- Node.js 18+ (LTS)
- pnpm installed globally:
  ```bash
  npm install -g pnpm
  ```

Install dependencies
- From repo root (or directly inside the app):
  ```bash
  cd apps/storefront
  pnpm install
  ```

Run the dev app
- Start the Vite dev server:
  ```bash
  pnpm dev
  ```
- Open http://localhost:5173

Run Storybook
- From `apps/storefront`:
  ```bash
  pnpm run storybook
  ```
- Open http://localhost:6006

Run tests
- Unit tests (vitest):
  ```bash
  pnpm test
  ```

Windows / PowerShell notes
- If `pnpm` scripts fail with script execution errors, run in cmd.exe or enable script execution for the current user:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  Then re-open PowerShell.

Troubleshooting
- If you see TypeScript type errors about missing `vite/client` or vitest globals, run `pnpm install` from `apps/storefront` (the repo provides a pnpm lockfile).
- If files show as untracked (for example `.storybook` was untracked), commit them:
  ```bash
  git add apps/storefront/.storybook
  git commit -m "Add Storybook config"
  git push
  ```

