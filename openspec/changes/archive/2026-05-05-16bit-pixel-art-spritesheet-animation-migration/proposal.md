# Proposal: 16-bit Pixel Art Sprite-Sheet Animation Migration

## Summary
Migrate gameplay-facing visuals from procedural rectangles and shape stacks toward 16-bit-like pixel art with true sprite-sheet animation, using `art.md` as the source of truth for key names, frame sizes, movement references, and animator wiring. The first implementation slice is intentionally narrow and apply-feasible: it updates high-impact gameplay visuals and animation wiring without attempting a full world migration in one pass.

## Goal
Deliver a first apply pass that proves the migration architecture and visible quality bar while preserving gameplay fairness and timing.

## Scoped Apply Slice (Pass 1)
1. Player gameplay sprite migration to sprite-sheet animation states using `player-sheet` contract rows and clip mapping from `art.md`.
2. Platform surface migration for static platform families using pixel tile textures (`platform-tiles`, `terrain-sticky`, `terrain-brittle`) with readable state variants.
3. Gravity field and capsule support visual migration for field motifs and capsule parts using dedicated texture keys from `art.md`.
4. Hazard and interaction-prop migration for spike strips, reward blocks, and activation nodes from rectangle visuals to pixel sprites.
5. Exit/arrival support-piece migration for base and beacon pieces while preserving existing completion flow behavior.

## Scope: What's In
- Add and register required new boot texture keys from the scoped slice in `src/phaser/assets/bootTextures.ts`.
- Introduce animation definitions and runtime state-driven animation selection for the gameplay player.
- Replace selected rectangle/graphics render paths in the listed game-scene rendering modules with sprite or tile-sprite usage.
- Preserve old keys and fallback render behavior during migration rollout safety checks.
- Keep nearest-neighbor/pixel-snap rendering constraints for new textures.

## Scope: What's Out
- Full migration of every optional UI shell element in `art.md`.
- Full enemy family animation overhaul beyond what is required for this first pass.
- New gameplay mechanics, new timing windows, or simulation constant changes.
- Tween-heavy cinematic behavior that changes readability or fairness.

## Why This Slice
- Covers the most visible gameplay surfaces and animation expectation (player + route-critical world pieces).
- Fits one apply pass by limiting optional shell migration and broad enemy rework.
- De-risks later passes by proving texture-key contract, animation binding, and render replacement patterns.

## Key Risks And Guardrails
1. Collision/readability drift: keep sprite bounds and anchors aligned with existing simulation/body extents.
2. Performance or memory spikes: use bounded atlas groups and avoid large unbounded runtime-generated sheets.
3. Timing/fairness regressions: no movement constant changes; animation timing follows existing runtime events and durations.
4. False-positive visual upgrades: reject tint-only substitutions and reject long tween-driven pseudo-animation in place of frame animation.

## Success Criteria
- [ ] Scoped keys from `art.md` are registered and available at boot for Slice 1.
- [ ] Gameplay player uses true frame animation clips mapped to movement/state transitions.
- [ ] Selected platform, gravity, hazard, reward, and exit-support visuals no longer rely on rectangle-only presentation in scoped paths.
- [ ] Existing gameplay timing and simulation constants remain unchanged.
- [ ] `npm run build` succeeds and `npm test` passes without introducing new failures attributable to this change.

## Touchpoints For Apply
- `src/phaser/assets/bootTextures.ts`
- `src/phaser/scenes/gameScene/bootstrap.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/gameScene/platformRendering.ts`
- `src/phaser/scenes/gameScene/gravityRendering.ts`
- `src/phaser/scenes/gameScene/enemyRendering.ts`
- `src/phaser/scenes/gameScene/rewardRendering.ts`
- `art.md`

## Validation Evidence (Apply Pass)

### Build Status
- **Result**: PASSED
- **Command**: `npm run build`
- **Output**: Vite compilation successful, all assets bundled, gzip sizes within expectations

### Test Results Summary
- **Total Tests**: 269 (7 failed, 262 passed)
- **Baseline Failures**: 7 pre-existing unrelated failures (audio manifests, stage validation, HUD styling)
- **Changed-Module Test Results**:
  - `src/phaser/assets/bootTextures.test.ts`: **9/9 PASSED** ✓
  - `src/phaser/scenes/gameScene/platformRendering.test.ts`: **1/1 PASSED** ✓
  - `src/phaser/scenes/gameScene/rewardRendering.test.ts`: **2/2 PASSED** ✓
  - `src/phaser/scenes/gameScene/enemyRendering.test.ts`: **3/3 PASSED** ✓

### Pre-Existing Baseline Failures (Not Attributable To This Change)
1. `src/styles/app.test.ts` - HUD message lane layout contract viewport styling (1 failure)
2. `src/phaser/audio/SynthAudio.test.ts` - Audio cue mappings (2 failures)
3. `src/game/content/stages.test.ts` - Stage validation rules (4 failures)

### Conclusion
No new test failures introduced by sprite-sheet animation migration. All changed modules pass tests. Baseline failures are isolated to unrelated subsystems (audio, styling, stage content validation) and were present before this change.

### Verification Scope For Archive
- Build passes without errors ✓
- Changed-module tests all pass ✓
- No change-attributable regressions ✓
- Baseline failure count unchanged (7 pre-existing) ✓
