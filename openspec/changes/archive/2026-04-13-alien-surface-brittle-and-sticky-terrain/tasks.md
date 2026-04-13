## 1. Surface Data and Validation

- [x] 1.1 Extend stage authoring metadata to describe brittle crystal and sticky sludge surface rectangles on supported terrain.
- [x] 1.2 Add bounded validation for surface kind, rectangle integrity, support alignment, and conflicting surface annotations.
- [x] 1.3 Update authored stage fixtures to include at least one brittle crystal route and one sticky sludge route that satisfy the new validation rules.

## 2. Runtime and Rendering

- [x] 2.1 Implement brittle crystal runtime state in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`, including warning, delayed break, fair support at expiry, and reset on death, checkpoint respawn, restart, and fresh attempts.
- [x] 2.2 Implement sticky sludge controller effects in the movement state so grounded acceleration, grounded max speed, and sludge-sourced jump launch change without breaking buffering, coyote time, spring launches, dash, or low-gravity sequencing.
- [x] 2.3 Sync `src/phaser/scenes/GameScene.ts` rendering with the authored surface metadata and brittle runtime state so warning, intact, broken, and sludge-covered terrain stay visually consistent with simulation.

## 3. Verification

- [x] 3.1 Add regression tests in `src/game/simulation/state.test.ts` for brittle collapse timing/reset behavior and sticky sludge controller interactions.
- [x] 3.2 Extend `scripts/stage-playtest.mjs` with a short traversal probe that verifies one brittle-floor escape route and one sticky-sludge traversal route and confirms their authored extents are present in the live scene.
- [x] 3.3 Run the relevant automated tests and playtest coverage and record the results for the new terrain surfaces.