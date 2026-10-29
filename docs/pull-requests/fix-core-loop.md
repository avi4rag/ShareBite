## Summary
Connect the existing order page to the server's real-time events and make protected photos visible to authorized participants. Verify the complete donor-to-NGO journey in a real browser and surface NGO requests to donors.

## Changes
- Join and leave private order rooms, receive live messages and typing, and expose chat reporting.
- Fetch protected food and distribution photos with the signed-in session token.
- Link a successful claim to its order and use the actual certificate verification URL in PDFs.
- Show open NGO demand requests on the donor dashboard and allow the owning NGO to mark a request fulfilled.
- Add an automated Chrome walkthrough from posting to PDF download and donor confirmation.

## How to test
1. Run `npm install && npm run dev`.
2. Run `node scripts/verify-core-loop.mjs` against the running app.
3. Run `npm run lint`, `npm run build`, and `npm run test`.

## Screenshots / notes
The browser walkthrough used local Chrome and the automatic in-memory Jaipur seed. It uploaded both food and proof photos, masked a phone number in chat, and downloaded a certificate PDF. Network map tiles are optional because the local Jaipur backdrop remains available.

## Checklist
- [x] App runs with no JavaScript console errors in the full browser walkthrough
- [x] Lint/build passes
- [x] Responsive checked (discovery/map at 390px and 1440px in preceding PR)
- [x] Seed data still works (API test suite)
