## 1. Side-Aware Gravity-Room Validation

- [x] 1.1 Tighten enclosed gravity-room validation in `src/game/content/stages/validation.ts` so entry doors require reachable exterior-side approach support and exit doors require both interior-side reachability and usable exterior-side reconnect support.
- [x] 1.2 Update supporting gravity-room route helpers in `src/game/content/stages/builders.ts` and `src/game/content/stages/catalog.ts` so entry and exit door checks use authored door roles instead of one generic doorway-footing rule.
- [x] 1.3 Add or update focused unit coverage in `src/game/content/stages.test.ts` for wrong-side entry support, missing exit-side reconnects, and preserved acceptance of valid side-aware door layouts.

## 2. Stage Data Re-Authoring

- [x] 2.1 Re-author `forest-anti-grav-canopy-room` and `amber-inversion-smelter-room` so each entry door has a reachable exterior-side approach path and each exit door reconnects correctly after interior traversal.
- [x] 2.2 Re-author `sky-anti-grav-capsule` and `sky-gravity-inversion-capsule` so each room satisfies the new side-aware entry and exit door rules without changing the bounded-room model.
- [x] 2.3 Confirm the affected room layouts still preserve intended disable-button reachability, sealed shell containment, and route readability after the door-side adjustments.

## 3. Verification

- [x] 3.1 Run focused automated coverage for stage validation and gravity-room layouts, including `src/game/content/stages.test.ts` and any directly related builder or catalog coverage.
- [x] 3.2 Run the relevant gravity-room scripted playtest or equivalent targeted verification to confirm the corrected rooms remain traversable with correct-side entry and exit flow.