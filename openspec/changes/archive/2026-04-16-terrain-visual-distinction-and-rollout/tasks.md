## 1. Terrain Presentation

- [x] 1.1 Update the special-terrain rendering in `src/phaser/scenes/GameScene.ts` so `brittleCrystal` and `stickySludge` use distinct bounded overlay cues that remain readable beyond color and alpha alone.
- [x] 1.2 Ensure brittle crystal presentation clearly differentiates intact, warning, and broken states without introducing a texture or tilemap pipeline rewrite.
- [x] 1.3 Ensure sticky sludge presentation communicates viscous traversal through layered or subtly animated in-rectangle cues while preserving the current rectangle-based renderer path.

## 2. Stage Authoring And Validation

- [x] 2.1 Re-author the three current main stages in `src/game/content/stages.ts` so each includes at least two `brittleCrystal` surfaces and at least two `stickySludge` surfaces across at least two distinct traversal beats.
- [x] 2.2 Keep the broadened terrain rollout biome-specific and on intended route space or optional reconnecting branches rather than clustering it into one isolated sample section.
- [x] 2.3 Extend stage-data validation and authored-data tests in `src/game/content/stages.test.ts` to reject any current main stage that falls below the new per-kind rollout minimums.

## 3. Terrain State And Regression Coverage

- [x] 3.1 Add or update simulation coverage in `src/game/simulation/GameSession.test.ts` so brittle terrain state transitions still reset to the intact readable baseline after retry, checkpoint respawn, or fresh attempts.
- [x] 3.2 Extend `scripts/stage-playtest.mjs` to probe at least one brittle crystal section and one sticky sludge section and report the broadened terrain rollout during scripted verification.
- [x] 3.3 Run the relevant automated tests and scripted playtest coverage, then record that the new terrain cues and per-stage rollout minimums pass verification.