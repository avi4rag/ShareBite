## Summary
Turn the unread notification bell into a usable inbox. This closes the final visible gap in the live claim and status flow.

## Changes
- Open a responsive notification panel from the bell, with timestamps and direct links.
- Mark individual updates or all updates as read using the existing API.
- Extend the full browser walkthrough to verify an arriving claim notification.

## How to test
1. Run `npm install && npm run dev`.
2. Run `node scripts/verify-core-loop.mjs` and confirm the inbox step passes.
3. Run `npm run lint`, `npm run build`, and `npm run test`.

## Screenshots / notes
The panel is anchored below the bell on desktop and fixed within the mobile viewport. Escape closes it. The browser walkthrough found the new claim notification and marked all updates read without console errors.

## Checklist
- [x] App runs with no JavaScript console errors in the full browser walkthrough
- [x] Lint/build passes
- [x] Responsive checked (desktop and 390px layout)
- [x] Seed data still works
