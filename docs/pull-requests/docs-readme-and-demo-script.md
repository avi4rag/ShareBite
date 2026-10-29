## Summary
Replace the setup-only README with a complete demo guide. Explain automatic in-memory seeding, persistent MongoDB configuration, demo accounts and a timed three-minute judge walkthrough.

## Changes
- Document the exact `npm install && npm run dev` start path and first-run MongoDB binary download.
- List demo roles, seeded data counts, feature routes and validation commands.
- Give a five-step donor-to-NGO-to-impact walkthrough and the automated browser check.

## How to test
1. Follow the README commands from the repository root.
2. Open `http://localhost:5173` and use each Demo Mode button.
3. Run `node scripts/verify-core-loop.mjs` against the running app.

## Screenshots / notes
Documentation only. It names the current build chunk-size warning and the first-run network requirement for the MongoDB binary rather than presenting them as silent failures.

## Checklist
- [x] App runs with no JavaScript console errors in the full browser walkthrough
- [ ] Lint/build passes
- [x] Responsive checked (mobile and desktop visual audit in prior PR)
- [x] Seed data still works
