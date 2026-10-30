## Summary

Connect the Vercel client to the Render API and make the Render server safe to run against persistent MongoDB. The live Vercel `/api/listings` path currently returns a non-JSON 404, while Render's listings endpoint responds with JSON; this PR fixes the routing and documents the dashboard settings needed to redeploy both services.

## Changes

- Centralise client API, Socket.io, and server-hosted image URLs; report non-JSON API responses with a useful message and console URL/status.
- Add Vercel API, upload, seed-asset, and SPA rewrites.
- Bind Render to `0.0.0.0:$PORT`, align API and Socket.io CORS with `CLIENT_URL`, enable trust proxy, and preserve protected upload access.
- Require persistent MongoDB in production and seed an empty configured database once with `SEED_ON_START`.
- Force API tests to ignore any configured `.env` MongoDB URI and add an isolated production smoke test.
- Document exact Render, Atlas, and Vercel settings in the README and environment examples.

## How to test

1. Run `npm install`, `npm run lint`, and `npm run test` from the root.
2. Run `node scripts/verify-production.mjs` to check JSON endpoints, seed, demo logins, CORS, and JSON 404 against a temporary database.
3. Set `VITE_API_URL=https://sharebite-3zgy.onrender.com` and `VITE_SOCKET_URL=https://sharebite-3zgy.onrender.com`, then run `npm run build`.
4. Apply the README dashboard settings, redeploy Render and Vercel, then open `/discover` and refresh `/login` on the live Vercel domain.

## Screenshots / notes

No product design changes. The live Render root and data routes already returned JSON during the audit, while Vercel `/api/listings` returned a 404 before these rewrites. A production-built client preview fetched 20 cards from Render's JSON feed with no browser console errors. The Vercel and Render dashboard variables still need to be applied by the project owner after merge. Render's free filesystem does not persist uploaded photos.

## Checklist

- [x] Production-built client preview loads the Render feed with no console errors (live Vercel still needs redeploy)
- [x] Lint passes and 17 isolated API tests pass
- [x] Responsive design remains unchanged
- [x] Temporary production MongoDB seeds and serves Jaipur data
- [x] Production client build passes with `VITE_API_URL` and `VITE_SOCKET_URL` set to Render
