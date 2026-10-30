# ShareBite

> **Good food. Another chance.**

ShareBite helps Jaipur kitchens share fresh surplus food with verified community organisations. Donors post what they can offer, NGOs arrange a timely pickup, and both sides can follow the journey through distribution. Impact counts only meals backed by distribution proof.

Built as a hackathon-ready full-stack demo, ShareBite runs with one command and comes to life with realistic Jaipur data.

**Live app:** [sharebite-anurag.vercel.app](https://sharebite-anurag.vercel.app) · **API health:** [sharebite-3zgy.onrender.com/api/health](https://sharebite-3zgy.onrender.com/api/health)

**[Quick start](#quick-start) · [Three-minute demo](#three-minute-demo) · [Features](#what-you-can-do) · [Configuration](#configuration) · [Development](#development-and-verification)**

## Quick start

You need **Node.js 20.19+**, **npm 10+**, and internet access for the first in-memory MongoDB binary download. No MongoDB account, API key, or `.env` file is required.

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:4000**; [the health endpoint](http://localhost:4000/api/health) reports whether it is ready and which database mode is active. Vite proxies local API, image, and Socket.io requests to the server.

With no `MONGO_URI`, ShareBite starts an in-memory MongoDB and seeds the demo automatically. The server logs this mode clearly. **Memory-mode data resets when the server stops.** The first start downloads the MongoDB binary (about 70 MB); later starts reuse the cached copy.

### Demo accounts

Use the **Demo Mode** buttons on the login page, or sign in with these accounts. All three passwords are **`Demo@1234`**.

| Role | Email | Best place to begin |
| --- | --- | --- |
| Donor | `donor@demo.com` | [Share food](http://localhost:5173/donate), then view the dashboard |
| NGO | `ngo@demo.com` | [Explore food](http://localhost:5173/discover), then claim a listing |
| Admin | `admin@demo.com` | [Admin panel](http://localhost:5173/admin) for verification and moderation |

The seed has **26 donors, 15 NGOs, 68 listings, and 36 completed orders**, plus reviews, chat histories, notifications, reports, and meal requests. Twelve NGOs are verified; two are pending and one is rejected. Organisation names, registration numbers, and profiles are fictional demo content. Jaipur neighbourhoods and coordinates are realistic, and seed food photos are bundled locally.

## Three-minute demo

| Time | Action | What to point out |
| --- | --- | --- |
| **0:00–0:30** | Start on the landing page; open **Explore food** and switch between cards and map. | Live impact, Jaipur listings, distance and pickup urgency. |
| **0:30–1:15** | In **Demo Mode**, log in as **Donor**. Open **Share food**, enter details, upload a food photo, set the pickup address, accept the safety declaration, and post. | The safety countdown; the exact address stays private until a claim. Saved templates make repeat donations faster. |
| **1:15–1:55** | Use **Switch role** to log in as **NGO**. Find the new food listing, claim it, and open the order chat. | The collection is reserved for one NGO. A phone number sent in chat is masked automatically. |
| **1:55–2:35** | Confirm pickup, then upload a distribution photo, a people-fed count, and a short note. | The order timeline reaches **Distributed**; the donor receives a notification and can see the proof. |
| **2:35–3:00** | Open **Leaderboard**, update the certificate, and download its PDF. Switch back to Donor to view the completed order and impact dashboard. | Rankings use proof-backed meals served, and each certificate has a public verification page. |

For a repeatable browser check of the same journey, keep the app running and execute:

```bash
node scripts/verify-core-loop.mjs
```

This script uses local Chrome or Edge to post food, claim it, send a masked chat message, complete pickup and proof, download a certificate, check the notification inbox, and confirm the donor sees the result. It also fails on browser console errors.

## What you can do

| Area | Capabilities |
| --- | --- |
| **Public** | Browse the landing page, food discovery feed and map, NGO directory, impact leaderboard, and public certificate pages. |
| **Donor** | Register or log in; post a donation with photos, quantity, food type, allergens, preparation time, pickup window, and map location; save a usual-surplus template; invite one NGO privately; follow orders, respond to NGO meal requests, view impact, and download certificates. |
| **NGO** | Discover and filter nearby food; claim available donations; coordinate through order chat; confirm pickup; upload distribution proof; review donors; post and fulfil demand requests; view capacity and impact. |
| **Admin** | Review submitted verification documents, verify or reject accounts, ban or restore users, review reports, inspect orders, and view platform analytics. |
| **Live updates** | Receive in-app notifications for nearby food, claims, messages, status changes, and verification results. Open the bell inbox to read or clear updates. |

### The donation journey

```text
Available → Claimed → Picked Up → Distributed
     └──────────────→ Expired
     └──────────────→ Cancelled (before a claim)
```

Only a verified NGO can claim a donation. The claim locks the listing, and its exact pickup address becomes visible to the confirmed participants. The NGO uploads a photo and people-fed count to complete distribution; these verified meals drive impact cards, badges, rankings, and certificates. Participants can leave reviews after completion. A job checks each minute for listings whose pickup or safety window has closed and sends notifications.

**Food safety:** the “safe until” time is a planning estimate based on food category and preparation time, not a certification. Donors must confirm safe handling, and collection teams should decline food whose condition is uncertain.

## Configuration

The app works without an `.env` file. To change its settings, copy `.env.example` to `.env` in the repository root and edit the values:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Empty | Persistent MongoDB connection. Required in production; development falls back to memory if it is missing or unreachable. |
| `JWT_SECRET` | Generated on startup in development | Signing secret for login tokens. **Required** when `NODE_ENV=production`. |
| `PORT` | `4000` | Express API and Socket.io port. |
| `CLIENT_URL` | Vercel production domain plus local origins | Comma-separated allowed browser origins for the API and Socket.io. |
| `NODE_ENV` | Development | Set `production` on Render. Production requires MongoDB and `JWT_SECRET`. |
| `SEED_ON_START` | `true` | Seeds an empty database at startup; never clears existing users. Set `false` to disable. |
| `DEMO_MODE` | Enabled outside production | Set `false` to disable one-click demo login. |
| `VITE_API_URL` | Unset | Client API origin. Set to the Render origin on Vercel; when unset, the client uses relative `/api` and the Vercel rewrite or local Vite proxy. |
| `VITE_SOCKET_URL` | `VITE_API_URL` or current origin | Socket.io origin. Set to the Render origin on Vercel for direct realtime traffic. |

With a reachable `MONGO_URI`, the database is persistent and existing users are preserved. An empty database is seeded on startup unless `SEED_ON_START=false`. You can also run `npm run seed` to populate an empty configured database. The seed command skips a database that already has users; without `MONGO_URI`, it validates the seed in a temporary memory database rather than persisting it. Uploaded files are stored locally in `server/uploads/`.

**Keep `.env` private.** The example file contains no credentials, and `.gitignore` excludes `.env`, uploads, build output, and dependencies. For local development, leave `VITE_` values unset so Vite uses its proxy. Vite reads client variables from `client/.env.local` or Vercel's dashboard, not the root `.env`.

## Deploying: Vercel + Render

The deployed frontend runs on **Vercel** from `client/`; the API runs on **Render** from `server/`. The client calls Render directly when `VITE_API_URL` is set. Otherwise, `client/vercel.json` proxies `/api`, `/uploads`, and `/seed-assets` to Render. It also routes refreshed pages such as `/login` and `/discover` back to the React app. Set `VITE_SOCKET_URL` to Render for direct realtime connections.

> **Live route check, 30 October 2026 (IST):** Vercel `/api/listings` returned **200 JSON**, a direct refresh of Vercel `/login` returned **200 HTML**, and Render `/api/health` returned **200 JSON**. This confirms the API proxy and SPA fallback are serving the deployed site.

### 1. Render backend

In the Render web service dashboard, use **branch `main`**, **Root Directory `server`**, **Build Command `npm install`**, and **Start Command `node src/index.js`**. Set these Environment variables:

```text
NODE_ENV=production
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long, random secret you generate>
CLIENT_URL=https://sharebite-anurag.vercel.app,http://localhost:5173,http://127.0.0.1:5173
SEED_ON_START=true
DEMO_MODE=true
```

Render supplies `PORT`; the server binds to `0.0.0.0` on that port. `DEMO_MODE=true` keeps the one-click judges' accounts available; switch it to `false` after the demo. In MongoDB Atlas, add **`0.0.0.0/0`** under **Network Access** so Render can connect, then redeploy the Render service. Confirm its root URL and `/api/health` return JSON. An empty Atlas database receives the Jaipur demo seed once; restarts preserve existing users and orders. Production intentionally fails with a clear message if MongoDB is missing or unreachable rather than running an ephemeral in-memory database.

### 2. Vercel frontend

In the Vercel project dashboard, use **branch `main`**, **Root Directory `client`**, **Framework Preset `Vite`**, **Build Command `npm run build`**, and **Output Directory `dist`**. Set these Environment Variables for Production (and Preview if you use preview deployments):

```text
VITE_API_URL=https://sharebite-3zgy.onrender.com
VITE_SOCKET_URL=https://sharebite-3zgy.onrender.com
```

Use the origin exactly as shown: no `/api` suffix and no trailing slash. **Redeploy Vercel after editing either `VITE_` variable**, because Vite embeds these values at build time. Then refresh `/discover`: it should load food cards rather than an HTML error. Refresh `/login` directly to confirm the SPA fallback. If you omit `VITE_API_URL`, the relative `/api` request goes through the Vercel rewrite in `client/vercel.json`; direct Render calls are the recommended demo configuration.

### Production notes

- Render's free service may sleep when idle; the first request after a quiet period can take longer. Open `/api/health` before presenting.
- Render's free filesystem is ephemeral. MongoDB records persist in Atlas, but uploaded photos under `server/uploads/` do **not** survive a redeploy or restart. Bundled seed photos remain available. Use persistent object storage for uploads beyond the demo.
- The Vercel and Render origins are different, so `CLIENT_URL` must include the exact Vercel domain for API calls and Socket.io connections.
- The server's unknown `/api/*` routes return JSON 404 responses. If the browser sees HTML for an API request, check `VITE_API_URL`, the Vercel deployment, and the network response URL logged in the console.

## Project structure

```text
ShareBite/
├── client/              React app, pages, shared UI, styles, local map art
├── server/              Express API, Mongoose models, seed data, local food photos
│   ├── seed-assets/     Bundled demo images
│   └── uploads/         Runtime uploads (ignored by Git)
├── scripts/             Browser walkthroughs and workflow helpers
├── docs/                Design, architecture, and pull request notes
├── .env.example         Optional environment settings
└── package.json         Root commands for both workspaces
```

The **client** uses React 18, Vite, Tailwind CSS, reusable Radix/shadcn-style components, React Router, TanStack React Query, Framer Motion, lucide-react, React Leaflet with OpenStreetMap, Recharts, and jsPDF. The **server** uses Node.js, Express, Mongoose, JWT and bcrypt, Socket.io, node-cron, multer, and Zod validation. The interface uses Fraunces and Plus Jakarta Sans with warm paper, forest green, saffron, and an optional dark theme.

## Development and verification

Run these commands from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and Vite client together. |
| `npm run seed` | Seeds an empty configured MongoDB, or validates a temporary memory seed. |
| `npm run lint` | Runs ESLint across both workspaces. |
| `npm run build` | Builds the client and checks the server entry point. |
| `npm run test` | Runs the API, privacy, seed, startup, and lifecycle tests in an isolated in-memory database, ignoring any configured `MONGO_URI`. |
| `node scripts/verify-production.mjs` | Starts the real production server against a temporary MongoDB and checks JSON routes, seeding, demo logins, CORS, and JSON 404s without touching `.env`'s database. |
| `node scripts/verify-browser.mjs --existing --offline-map` | Checks key screens at desktop and mobile widths; saves screenshots under `.cache/screenshots/`. |
| `node scripts/verify-core-loop.mjs` | Exercises the full donor-to-NGO journey in Chrome or Edge. |

The visual and core-loop browser scripts expect `npm run dev` to be running already. The map uses OpenStreetMap tiles when reachable and a bundled Jaipur backdrop when tiles are unavailable; it needs no API key. The current production build succeeds with a warning about the size of its main JavaScript chunk.

### API overview

All application endpoints are under `/api`:

| Endpoint group | Purpose |
| --- | --- |
| `/api/auth`, `/api/users` | Login, registration, demo login, session, and profiles. |
| `/api/listings`, `/api/orders`, `/api/uploads` | Food listings, claims, status changes, proof, reviews, and protected files. |
| `/api/chat`, `/api/notifications` | Participant chat, message masking, and inbox updates. |
| `/api/ngos`, `/api/demands`, `/api/reports` | NGO directory, meal requests, and community reports. |
| `/api/stats`, `/api/leaderboard`, `/api/certificates` | Verified impact, rankings, and recognition. |
| `/api/admin` | Account verification, moderation, reports, and order oversight. |
| `/api/health` | Readiness and active database mode. |

The API validates inputs and checks roles server-side. Password hashes are never returned. Private listing addresses and protected uploads are available only to authorised participants or admins. Chat masks direct contact details to keep coordination on the platform.

## Troubleshooting

- **First start takes a while:** the in-memory database downloads its MongoDB binary on first use. Check internet access and let the download finish. A reachable `MONGO_URI` is another option.
- **Port 4000 or 5173 is busy:** stop the other ShareBite process before starting a second `npm run dev`. The API prints a specific port-collision message.
- **A donation disappeared after restart:** memory mode is temporary. Set `MONGO_URI` for persistent data.
- **Map tiles are unavailable:** the local Jaipur backdrop still displays listing markers. No map service account is needed.
- **Browser scripts cannot launch:** install Chrome or Edge locally. The application itself works in other modern browsers.
- **Live feed says the API is unavailable:** verify Render `/api/health`, then redeploy Vercel with `VITE_API_URL` set to the Render origin. The console logs the URL and status when the API returns non-JSON.

For design decisions, see the [design brief](docs/design-brief.md). For data, privacy, and runtime contracts, see [architecture](docs/architecture.md). Review notes from the feature branches are in [docs/pull-requests](docs/pull-requests).
