# 🛍️ Storefront v1

A minimal, fast, and accessible e-commerce UI built with React, Vite, and TailwindCSS, following Atomic Design principles.
Implements the full user flow — Catalog → Product → Cart → Checkout → Order Status, with an Ask Support panel powered by a local Q&A dataset.

## 🚀 Quick Start

1️⃣ Install dependencies:

```bash
pnpm install
```

2️⃣ Run development server:

```bash
pnpm dev
```

Open http://localhost:5173

3️⃣ Build for production:

```bash
pnpm build
```

4️⃣ Run tests:

```bash
pnpm test
```

5️⃣ Run Storybook:

```bash
pnpm storybook
```

Open http://localhost:6006

## 🧩 Project Structure

```
/apps/storefront
├── index.html                    # Vite entry HTML
├── package.json                  # scripts & deps
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
│
├── /public
│   ├── logo.svg                  # app logo
│   └── mock-catalog.json         # mock product data (≥20 items)
│
├── /src
│   ├── main.tsx                  # app bootstrap
│   ├── App.tsx                   # app shell, header, footer, assistant
│   │
│   ├── /pages                    # routed pages
│   │   ├── catalog.tsx
│   │   ├── product.tsx
│   │   ├── cart.tsx
│   │   ├── checkout.tsx
│   │   └── order-status.tsx
│   │
│   ├── /components               # Atomic Design (atoms → templates)
│   │   ├── /atoms
│   │   ├── /molecules
│   │   ├── /organisms
│   │   └── /templates
│   │
│   ├── /lib                      # logic, mocks and helpers
│   │   ├── api.ts
│   │   ├── router.tsx
│   │   ├── store.ts
│   │   └── format.ts
│   │
│   └── /assistant                # Ask Support implementation
│       ├── ground-truth.json
│       ├── prompt.txt
│       └── engine.ts
│
└── component-prompts.md          # notes about AI-generated scaffolding

## 🧠 Features

⚡ React + Vite + TypeScript — fast modern setup
🎨 TailwindCSS — utility-first design system
🧩 Atomic Design Structure — modular components (atoms → molecules → organisms → templates)
🛒 Persistent Cart — built with Zustand and LocalStorage
📦 Mock API — powered by mock-catalog.json
🤖 Ask Support Panel — answers from ground-truth.json (no external API by default)
🧪 Unit Tests — via Vitest + React Testing Library
📘 Storybook — for visual component documentation

## 🧰 Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview the build
pnpm test       # Run tests
pnpm storybook  # Launch Storybook UI
```

## ⚙️ Environment Setup

If using the assistant with live model access copy `.env.example` → `.env` and add:

```bash
OPENAI_API_KEY=your_key_here
```

`.env` is ignored by .gitignore — don’t commit secrets.

## ✅ Submission Checklist

✔ Catalog grid with Add-to-Cart
✔ Product details + related items
✔ Persistent cart (localStorage)
✔ Checkout and fake order generation
✔ Dynamic order status (Placed → Packed → Shipped → Delivered)
✔ Ask Support assistant (local only)
✔ Tests passing via Vitest
✔ Storybook for components
✔ Clean .gitignore
✔ Runs with pnpm dev and builds successfully

## ⚡ Performance & Accessibility

🚀 Target: <200 KB JS gzipped (excluding images)
🖼️ Lazy-loaded images
♿ Keyboard + ARIA support
⏱️ Route transitions <250ms

## 🧾 Tech Stack

Framework: React 19 + TypeScript
Build: Vite
Styling: TailwindCSS
State: Zustand
Testing: Vitest + Testing Library
Docs: Storybook

## 📂 File Overview

/components → atomic UI blocks
/pages → main views
/lib → logic (API, store, utils)
/assistant → Ask Support engine
/public → static assets

## 🧹 .gitignore (highlights)

node_modules
.pnpm-store
dist
storybook-static
coverage
.vitest
*.log
.DS_Store
Thumbs.db
.idea
.vscode
*.tsbuildinfo
.env
temp/

## � License

Created for Eurisko Academy — Week 4 Frontend Assignment
© 2025 Storefront Project — All rights reserved.

*** End Patch



