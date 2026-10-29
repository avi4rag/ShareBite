# ShareBite

**Good food. Another chance.** ShareBite connects surplus food from Jaipur kitchens with verified community organisations while it is still fresh. The demo follows one donation from posting through collection, distribution proof, verified impact and a downloadable Certificate of Honor.

## Run it

Requires Node.js 20.19+ and npm 10+. From the repository root:

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The Express API runs on port 4000. No `.env` or external database is required. When `MONGO_URI` is absent or unreachable, the server starts an in-memory MongoDB, seeds Jaipur demo data automatically, and logs the active database mode. Its data resets when the server stops. The first memory-mode run downloads a MongoDB binary (about 70 MB), so that first start needs internet access. Subsequent runs use the local cache.

For persistent data, copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`. `npm run seed` populates an empty configured database; it never clears existing users. With no `MONGO_URI`, that command validates the seed in a temporary database and `npm run dev` seeds its own memory database automatically. `DEMO_MODE=false` turns off the one-click demo login. Production requires `JWT_SECRET`.

## Demo accounts

All three use **Demo@1234**. The login page also has one-click Demo Mode buttons for each role.

| Role | Email | What to show |
| --- | --- | --- |
| Donor | `donor@demo.com` | Donation history, saved surplus template, impact and certificates |
| NGO | `ngo@demo.com` | Discovery, claims, orders, chat, proof and demand requests |
| Admin | `admin@demo.com` | Verification queue, reports, users and platform analytics |

The seed includes 26 donors, 15 NGOs (12 verified, two pending, one rejected), 68 listings across statuses, 36 completed orders, reviews, chat histories, unread notifications, reports and demand requests. Names and registration numbers are fictional demo data; Jaipur neighbourhoods and coordinates are realistic. Food photos are bundled locally.

## Three-minute judge walkthrough

1. **0:00–0:30 · Meet ShareBite.** Open the landing page. Show the impact counters, recent donations and featured NGOs. Open **Explore food**, switch between cards and the Jaipur map, and point out urgency timers.
2. **0:30–1:15 · Share fresh food.** Select **Login as Donor** from `/login`, then **Share food**. Enter a food name, quantity and description, upload a small JPG/PNG/WebP photo, set a pickup address, confirm the safety declaration and post. Mention the safety countdown and that the exact address stays private before a claim. **Your usual surplus** offers a faster repeat path.
3. **1:15–1:55 · Claim and coordinate.** Choose **Switch role → Login as NGO**, open **Explore food**, find the new listing by its food name and claim it. Open **collection and chat**. Send a message containing a phone number to show the automatic contact mask. The donor receives a live claim notification in the bell inbox.
4. **1:55–2:35 · Prove distribution.** In the NGO order, select **Confirm pickup**, then **Upload distribution proof**. Add a photo, people fed count and short note. The timeline reaches **Distributed** and verified meals increase.
5. **2:35–3:00 · See the impact.** Open **Leaderboard**, update the certificate and **Download PDF**. Its ID links to a public verification page. Switch back to Donor to show the completed order, proof image and impact dashboard. If time allows, switch to Admin for verification and report queues.

The repeatable automated walkthrough is `node scripts/verify-core-loop.mjs` while the dev app is running. It performs the post → claim → chat → pickup → proof → PDF → donor confirmation journey in Chrome, checks the notification inbox and fails on browser console errors.

## Features and routes

- Public landing, live impact, discovery cards and clustered map, NGO directory, leaderboard and certificate verification.
- Donor posting with category-based safety estimate, uploaded photos, location pin, private NGO invitation and saved templates; dashboard with proof-backed impact and NGO meal requests.
- Verified NGO claims, status timeline, participant-only chat, masked contact details, proof upload, two-way reviews and demand requests.
- Socket.io notifications and chat, an inbox with read controls, admin verification and moderation, and a minute-by-minute expiry job.
- JWT role checks on client and server, server-side validation and private upload/address access rules.

API routes are under `/api` (`auth`, `users`, `ngos`, `listings`, `orders`, `chat`, `leaderboard`, `certificates`, `reports`, `notifications`, `demands`, `admin`, `stats`). `/api/health` reports the current database mode and readiness.

## Checks

```sh
npm run lint
npm run build
npm run test
node scripts/verify-browser.mjs --existing --offline-map
node scripts/verify-core-loop.mjs
```

The visual script captures desktop and mobile screenshots under `.cache/screenshots/`. The map uses OpenStreetMap tiles when available and a bundled Jaipur illustration when tiles are unavailable; no map API key is needed. The production build currently warns about a large main JavaScript chunk, but builds successfully. Google Chrome or Edge is needed for the browser scripts, not for using ShareBite.

## Repo and design notes

`client/` is React 18, Vite, Tailwind, shadcn-style primitives, React Router, TanStack Query, Framer Motion, Leaflet, Recharts and jsPDF. `server/` is Express, Mongoose, JWT/bcrypt, Socket.io, node-cron and multer. The brand uses Fraunces and Plus Jakarta Sans, warm paper, forest green and saffron, with a dark mode toggle. [Design brief](docs/design-brief.md) and [architecture contracts](docs/architecture.md) explain the choices. Feature work was merged through focused pull requests; review descriptions are retained in [docs/pull-requests](docs/pull-requests).
