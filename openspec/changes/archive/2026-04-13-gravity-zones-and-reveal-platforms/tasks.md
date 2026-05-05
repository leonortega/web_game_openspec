## 1. Stage Authoring and Data Model

- [x] 1.1 Extend stage content definitions and validation for authored low-gravity rectangles, reveal platform records, linked reveal volumes, and stable reveal IDs
- [x] 1.2 Add or update authored stage fixtures in `src/game/content/stages.ts` so at least one route exercises low-gravity traversal and one route exercises reveal-platform discovery

## 2. Simulation and Scene Behavior

- [x] 2.1 Add attempt and checkpoint state for revealed platforms in `src/game/simulation/state.ts` and wire serialization or restoration paths needed for respawn
- [x] 2.2 Update `src/game/simulation/GameSession.ts` to apply player-only low-gravity acceleration with the specified interaction order for jump, double jump, dash, springs, and falling-platform escape timing
- [x] 2.3 Update `src/game/simulation/GameSession.ts` to reveal linked platforms from proximity volumes, keep them solid for the current attempt, and snapshot only post-reveal state into checkpoints
- [x] 2.4 Update `src/phaser/scenes/GameScene.ts` so hidden reveal platforms stay non-visible and non-solid until revealed, then remain visible and collidable after the state changes

## 3. Verification

- [x] 3.1 Add or extend `src/game/simulation/state.test.ts` coverage for reveal-platform checkpoint persistence and reset behavior
- [x] 3.2 Add or extend `src/game/simulation/GameSession.test.ts` coverage for low-gravity interaction order across jumps, dash, springs, and falling-platform escape timing
- [x] 3.3 Update `scripts/stage-playtest.mjs` to validate low-gravity traversal sections and reveal-platform discovery routes during stage playtests
- [x] 3.4 Run the relevant automated tests and stage playtest validation and record the results