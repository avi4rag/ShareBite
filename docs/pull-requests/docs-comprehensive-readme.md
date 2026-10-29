## Summary

Rewrite the README as the main entry point for running, understanding, and demonstrating ShareBite. Keep the one-command setup prominent while providing enough detail for judges and contributors to follow the product and verify the full journey.

## Changes

- Add a quick start, demo accounts, seed data overview, and timed three-minute walkthrough.
- Explain the donor, NGO, and admin features and the donation status lifecycle.
- Document environment variables, persistence, project structure, scripts, API groups, privacy rules, and troubleshooting.
- Link the existing design and architecture notes.

## How to test

1. Read the quick start and compare the commands with root `package.json` and `.env.example`.
2. Run `npm run lint`, `npm run build`, and `npm run test`.
3. With `npm run dev` running, follow the three-minute demo or run `node scripts/verify-core-loop.mjs`.

## Screenshots / notes

Documentation only. The README uses short sections, a command table, and a timed demo table to stay scannable. It explicitly describes the first-run MongoDB download, memory-mode reset, and current build warning.

## Checklist

- [x] App runs with no JavaScript console errors in the existing full browser walkthrough
- [x] Lint/build passes
- [x] Responsive checked in prior visual audit
- [x] Seed data is unchanged by this documentation PR
