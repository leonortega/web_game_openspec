## 1. Grounded Contract Audit

- [x] 1.1 Audit grounded object categories anchored by `src/phaser/assets/bootTextures.test.ts` and identify every floor-bound enemy, hazard, checkpoint, or comparable grounded prop that still depends on normalization instead of authored flush support.
- [x] 1.2 Confirm flyers and ovni actors stay explicitly exempt from the grounded-contact contract and document any grounded categories that will move to shared support assertions.

## 2. Shared Support Guardrails

- [x] 2.1 Add reusable authored-flush-to-support helpers in `src/game/content/stages/builders.ts` and `src/game/content/stages/validation.ts` for grounded enemies, floor hazards, checkpoints, and remaining in-scope grounded props.
- [x] 2.2 Update `src/game/content/stages.test.ts` so grounded catalog coverage fails when source placements depend on tolerant normalization, render-only nudges, or hidden support rather than visible intended support.

## 3. Runtime And Presentation Alignment

- [x] 3.1 Narrow or remove runtime snap-to-ground behavior in `src/game/simulation/GameSession.ts` for grounded gameplay entities so unsupported placements are reported instead of silently corrected.
- [x] 3.2 Align checkpoint beacon placement and respawn anchoring to the same resolved support path, and update any affected grounded asset or scene placement code in `src/phaser/assets/bootTextures.ts`, `src/phaser/scenes/gameScene/enemyRendering.ts`, and `src/phaser/scenes/gameScene/rewardRendering.ts` only where contract mismatches remain.

## 4. Focused Regression Coverage

- [x] 4.1 Update focused tests in `src/game/simulation/GameSession.test.ts` and `src/phaser/assets/bootTextures.test.ts` to verify grounded entities no longer rely on runtime or render masking while flyer behavior remains unchanged.
- [x] 4.2 Run targeted automated checks for the touched stage-content, simulation, and asset/render slices needed by this change, without requiring scripted or manual gameplay validation.