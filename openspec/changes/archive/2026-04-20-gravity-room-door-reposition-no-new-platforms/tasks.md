## 1. Validation And Authoring Contract

- [x] 1.1 Update gravity-room validation and supporting authoring helpers so current-rollout door-side checks reuse existing intended route supports, while still allowing either fixed or moving-platform doorway support.
- [x] 1.2 Add or update focused coverage in `src/game/content/stages.test.ts` for valid reused doorway supports, invalid dedicated helper-platform doorway support, and any coordinated route-rectangle expectations.

## 2. Current Gravity-Room Re-Authoring

- [x] 2.1 Reposition the forest and amber gravity-room entry and exit doors onto current usable supports only, preserving left-side entry and right-side exit without adding doorway-only helper platforms.
- [x] 2.2 Reposition the sky anti-grav and sky inversion gravity-room doors onto current usable supports only, including any route-rectangle updates needed to keep approach, disable-button access, and exit reconnect readable.
- [x] 2.3 Confirm each affected room still preserves shell containment, intended room traversal, and fixed-or-moving support readability after door relocation.

## 3. Focused Verification

- [x] 3.1 Run focused automated stage validation coverage for the affected gravity-room layouts and their doorway-support rules.
- [x] 3.2 Run the relevant targeted gravity-room playtest coverage to confirm current rooms remain traversable after door relocation with no new helper platforms.