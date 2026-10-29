## Summary
Bring existing donation discovery and atomic claims into the responsive interface.
## Changes
- Search, diet/category/distance/serving filters, urgency/distance sorting and live countdowns.
- Clustered OpenStreetMap with meal-token markers and accessible detail buttons.
- Detail and collection pass with privacy-preserving addresses, claim/cancel controls and reporting.
- Reusable page, request-state, mutation and map components.
## How to test
Open /discover at desktop/mobile sizes; filter listings and switch map/cards. Claim as verified NGO and inspect the unlocked address. Try an unverified NGO and another claimant.
## Screenshots / notes
CI captures discovery and map screenshots at 1440px and 390px. OpenStreetMap requires network; cards remain usable when tiles fail. Direct main commits authorized by owner.
## Checklist
- [ ] App runs with no console errors (CI pending)
- [x] Lint/build passes
- [ ] Responsive checked (mobile + desktop; CI pending)
- [ ] Seed data still works (CI pending)
