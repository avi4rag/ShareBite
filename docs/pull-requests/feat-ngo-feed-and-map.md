## Summary
Finish the responsive styling for the discovery, map, posting and workspace screens already present on `main`. Add a local Jaipur map backdrop so clustered food markers remain readable when OpenStreetMap tiles cannot load.
## Changes
- Add missing workspace layout and component CSS across desktop and mobile widths.
- Add a locally bundled fallback map backdrop for unavailable tiles.
- Clear seven unused-import lint errors in the existing UI pages.
- Make the browser script reuse an already-running app and simulate unavailable tiles.
## How to test
Run `npm run lint`, `npm run build`, and `npm run test`. Start server and client; run `node scripts/verify-browser.mjs --existing --offline-map`. Inspect `/discover` at 1440px and 390px, switch map/cards, and open a listing.
## Screenshots / notes
The local run captured discovery and fallback-map screenshots at 1440px and 390px. OpenStreetMap tiles require network; the local backdrop keeps the map legible without them. Existing discovery and donor form implementations were merged earlier by a collaborator.
## Checklist
- [x] App runs with no JavaScript console errors in the offline-map browser check
- [x] Lint/build passes
- [x] Responsive checked (mobile + desktop)
- [x] Seed data still works (16 API tests)
