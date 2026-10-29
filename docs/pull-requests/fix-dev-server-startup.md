## Summary
Make startup failures actionable and add an API welcome endpoint. The original Windows crash is not yet reproduced or confirmed fixed. The user authorized direct main commits for this continuation.

## Changes
- Catch module/configuration, database, seed and HTTP binding failures; report the failing stage and recovery guidance.
- Clean up partially initialized resources; make shutdown idempotent.
- Validate PORT and redact MongoDB URIs in application startup diagnostics.
- Add GET / with app/version/database mode and a health link.
- Return HTTP 503 from health when Mongoose is disconnected.
- Update the stale milestone and document startup troubleshooting.

## How to test
- Run npm install, npm run lint, npm run build.
- Run node --test server/test/startup.test.js server/test/health.test.js.
- Run npm run dev -w server, then inspect http://localhost:4000/ and /api/health.
- Run npm run dev and the full npm test suite on a host that supports MongoDB.
- On Windows, verify fresh installation and startup outside OneDrive, then investigate any original OneDrive-specific failure with its actual error.

## Screenshots / notes
- Checkout audited at 33aa2cb; auth/profile already merged in PR #12; only main exists remotely; no open PRs or stashes.
- Current dev script was already plain node, not node --watch. Do not attribute the old failure to the watcher without evidence.
- npm install, lint, build and seven focused startup/HTTP tests pass on this Linux host (Node 24.22.1).
- MongoDB aborts before seeding with an invariant failure: numPartitions > 0 in partitioned_cache.h. This restricted host has no /proc and Node reports zero CPUs. Full database-dependent tests and browser verification cannot pass here. This is not proof of the Windows root cause.
- Native MongoDB is retained; no mock database or swallowed startup errors were introduced.
- Shell push failed because HTTPS credentials are unavailable. Connector writes also failed with HTTP 403 Resource not accessible by integration. Local commits must be pushed from an authorized checkout.

## Checklist
- [ ] App runs with no console errors
- [x] Lint/build passes
- [ ] Responsive checked (mobile + desktop)
- [ ] Seed data still works

## Resume checklist
- Done: setup, design system, server foundation, models/seed, listings/orders/chat/notifications/leaderboard/admin APIs, landing, auth/profile, cron expiry (existing merged PRs #1–12).
- Completed locally: startup lifecycle diagnostics, API root and readiness checks, focused regression tests.
- In progress: reproduce original Windows error, verify real database startup and publish local commits.
- Next: NGO feed/map, donor form, order timeline, realtime chat UI, leaderboard/certificates, dashboards, directory/reviews, admin UI, final demo and polish.
- Notifications API was included in chat PR #7; expiry shipped early in PR #10. Do not rebuild them.
