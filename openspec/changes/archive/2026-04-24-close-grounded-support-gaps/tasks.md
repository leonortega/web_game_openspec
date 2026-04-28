## 1. Grounded Support Audit

- [x] 1.1 Audit `src/game/content/stages/catalog.ts`, `src/game/content/stages/builders.ts`, `src/phaser/assets/bootTextures.ts`, and `src/phaser/scenes/gameScene/rewardRendering.ts` to enumerate every grounded-enemy, checkpoint, and floor-anchored static category that still relies on fallback grounding.
- [x] 1.2 Classify explicit exemptions for flyers, hover enemies, and intentionally airborne content so grounded guardrails do not change their semantics.

## 2. Shared Authoring And Validation Contract

- [x] 2.1 Update `src/game/content/stages/builders.ts` and `src/game/content/stages/validation.ts` so in-scope grounded categories require real visible support in source data and fail when support only appears after hidden helpers, render-only Y nudges, loosened tolerances, or snap fallback.
- [x] 2.2 Extend authored stage coverage in `src/game/content/stages/stages.test.ts` to report unsupported grounded enemies, checkpoints, and floor-anchored static elements by exact authored entry.

## 3. Runtime And Presentation Alignment

- [x] 3.1 Update `src/game/simulation/GameSession.ts` so grounded enemies and floor-anchored checkpoint or static-prop setup reuse the authored support contract instead of silently repairing unsupported placements.
- [x] 3.2 Narrow bootstrap or render compensation in `src/phaser/assets/bootTextures.ts` and `src/phaser/scenes/gameScene/rewardRendering.ts` so those layers confirm grounded alignment without becoming the primary fix path.

## 4. Focused Regression Coverage

- [x] 4.1 Add or update focused tests in `src/game/simulation/GameSession.test.ts` and `src/phaser/assets/bootTextures.test.ts` to prove grounded actors and floor-anchored props no longer depend on fallback grounding while flyers remain exempt.
- [x] 4.2 Run targeted automated checks for the touched stage-content, simulation, and asset slices needed by this change, without requiring scripted or manual gameplay validation.