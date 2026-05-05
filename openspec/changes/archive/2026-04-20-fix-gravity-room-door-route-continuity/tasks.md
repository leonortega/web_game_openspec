## 1. Validation And Authoring Semantics

- [x] 1.1 Update gravity-room authoring and validation helpers in `src/game/content/stages/builders.ts`, `src/game/content/stages/validation.ts`, and `src/game/content/stages/types.ts` so entry and exit doors must continue a real platform path rather than only satisfy local support overlap.
- [x] 1.2 Preserve fixed-platform and moving-platform doorway support only when that support is part of the intended traversal path, and reject helper-only ledges or platforms added solely for door compliance.
- [x] 1.3 Add or update focused coverage in `src/game/content/stages.test.ts` for valid platform-path continuity, invalid compliance-only helper support, and coordinated route-rectangle expectations around gravity-room doors.

## 2. Current Gravity-Room Re-Authoring

- [x] 2.1 Re-author `forest-anti-grav-canopy-room` and `amber-inversion-smelter-room` so each entry door is used from a platform path and each exit door leads onto a platform path without helper-only supports.
- [x] 2.2 Re-author `sky-anti-grav-capsule` and `sky-gravity-inversion-capsule` with coordinated door, route-support, and route-rectangle updates so entry and exit continuity stays readable at gameplay speed.
- [x] 2.3 Confirm each affected room keeps shell containment, disable-button reachability, and intended traversal continuity after the door-path updates.

## 3. Focused Verification

- [x] 3.1 Run targeted automated stage validation and unit coverage for the affected gravity-room doorway continuity rules.
- [x] 3.2 Run the relevant focused gravity-room traversal playtests to confirm the four current rooms remain completable with real route-continuity entry and exit support.