## 1. Falling-Platform Probe Alignment

- [x] 1.1 Trace the current falling-platform `Mechanic Checks` probe in `scripts/stage-playtest.mjs` against the controller expectations covered in `src/game/simulation/GameSession.test.ts`.
- [x] 1.2 Update the helper-side jump input sequencing and pass criteria so falling-platform escape jumps follow the shipped controller truth, including the gravity-inversion composition case.

## 2. Gravity-Field Readability Probe Alignment

- [x] 2.1 Trace the current gravity-field readability heuristic in `scripts/stage-playtest.mjs` against the live-scene styling and stable debug-snapshot signals exposed by `src/phaser/view/gameSceneStyling.ts` and `src/phaser/scenes/GameScene.ts`.
- [x] 2.2 Replace the stale relative-alpha failure heuristic with a check that validates readable bounded gravity-field presentation through the current renderer contract.

## 3. Narrow Validation And Reporting

- [x] 3.1 Run the narrow automated validation needed to confirm `Mechanic Checks` no longer fails on the falling-platform jump probe or gravity-field readability probe.
- [x] 3.2 Confirm terrain-variant extents drift and brittle or sticky readability failures remain unchanged and out of scope for this change's report cleanup.