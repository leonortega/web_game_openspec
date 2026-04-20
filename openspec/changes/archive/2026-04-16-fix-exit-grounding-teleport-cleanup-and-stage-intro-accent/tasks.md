## 1. Exit Grounding Validation

- [x] 1.1 Update `src/game/content/stages.ts` so authored exit validation rejects unsupported or floating exit placement and preserves the existing exit rectangle authoring model.
- [x] 1.2 Adjust any affected authored stage exit placement to satisfy the new grounded-endpoint rule without changing intended progression order.
- [x] 1.3 Add or update focused coverage in `src/game/content/stages.test.ts` for accepting supported exits and rejecting unsupported exit endpoints.

## 2. Finish Cleanup And Intro Accent

- [x] 2.1 Update `src/game/simulation/GameSession.ts` and any supporting runtime state so the exit-finish sequence keeps the player non-interactive and suppresses ordinary player visibility once disappearance begins until handoff completes.
- [x] 2.2 Update `src/game/simulation/GameSession.test.ts` with focused completion-flow coverage for single-trigger behavior, finish persistence, and no late player reappearance before the results handoff.
- [x] 2.3 Update `src/phaser/scenes/GameScene.ts` and any dependent presentation assets or setup so the stage-exit capsule reads as grounded and the finish effect stays visually distinct from traversal capsules.
- [x] 2.4 Update `src/phaser/scenes/StageIntroScene.ts` and any dependent setup in `src/phaser/scenes/BootScene.ts` so the intro accent remains abstract and non-figurative instead of reading like a player-character silhouette.

## 3. Validation And Playtest Coverage

- [x] 3.1 Update `scripts/capsule-exit-teleport-finish-playtest.mjs`, `scripts/stage-playtest.mjs`, or equivalent coverage so exit grounding, clean finish disappearance, and intro-surface accent behavior are exercised.
- [x] 3.2 Run `npm test` and `npm run build`, then fix any regressions introduced by this change.
- [x] 3.3 Run the relevant stage-flow playtest coverage and confirm supported exit placement, no finish-state reappearance, and a non-figurative stage intro accent in the recorded result.