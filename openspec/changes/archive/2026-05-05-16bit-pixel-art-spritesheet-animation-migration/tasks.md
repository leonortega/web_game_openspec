# Tasks: 16-bit Pixel Art Sprite-Sheet Animation Migration (Slice 1)

## Phase 1: Art-Contract And Boot Registration
- [x] 1.1 Confirm Slice 1 key list against `art.md` and freeze implementation key contract for this pass.
- [x] 1.2 Add scoped keys to `REQUIRED_BOOT_TEXTURE_KEYS` in `src/phaser/assets/bootTextures.ts`.
- [x] 1.3 Register scoped textures/sheets in `registerBootTextures` with nearest-neighbor settings.
- [x] 1.4 Preserve legacy keys and fallback paths for non-migrated consumers.

## Phase 2: Player Sprite-Sheet Animation Migration
- [x] 2.1 Create gameplay player sprite/sheet object path in `src/phaser/scenes/gameScene/bootstrap.ts`.
- [x] 2.2 Define player animation clips and frame ranges in scene animation setup.
- [x] 2.3 Implement deterministic player animation state resolver in `src/phaser/scenes/GameScene.ts` using runtime state events.
- [x] 2.4 Map resolver priorities to `art.md` animator checklist order.
- [x] 2.5 Keep existing movement constants and state timings unchanged.

## Phase 3: Route-Critical World Visual Migration
- [x] 3.1 Replace scoped platform rectangle paths with tile/sprite rendering in `src/phaser/scenes/gameScene/platformRendering.ts` for `platform-tiles`, `terrain-sticky`, and `terrain-brittle`.
- [x] 3.2 Implement brittle state visuals (`intact`, `warning`, `ready`, `broken`) without changing brittle timing semantics.
- [x] 3.3 Replace scoped gravity field/capsule rectangle paths in `src/phaser/scenes/gameScene/gravityRendering.ts` with slice keys.
- [x] 3.4 Replace scoped spike hazard rectangle paths in `src/phaser/scenes/gameScene/enemyRendering.ts` with `hazard-spikes` visuals.
- [x] 3.5 Replace scoped reward/activation rectangle paths in `src/phaser/scenes/gameScene/rewardRendering.ts` with `reward-block` and `activation-node` visuals.
- [x] 3.6 Replace scoped exit/arrival support rectangles in bootstrap/game-scene setup with `exit-base`, `exit-beacon`, `arrival-base`, and `arrival-beacon`.

## Phase 4: Guardrails, Validation, And Documentation Sync
- [x] 4.1 Validate sprite anchors/origins and display sizes against existing collision/body expectations.
- [x] 4.2 Confirm no gameplay timing or fairness regressions from animation/render changes.
- [x] 4.3 Run `npm run build` and `npm test`; address only regressions attributable to this change.
- [x] 4.4 Update `art.md` migration checklist notes with completed Slice 1 key usage status.
- [x] 4.5 Record deferred keys and remaining migration backlog for next slice.

## Apply Exit Criteria
- [x] All Phase 1 through Phase 4 tasks are complete.
- [x] Player gameplay visuals use true sprite-sheet animations in runtime.
- [x] Scoped platform, gravity, hazard, reward, and exit-support visuals are sprite/tile-based in target touchpoints.
- [x] No simulation-constant changes were introduced.
- [x] Build and test validation completed with no unresolved change-attributed regressions.

---

## Apply Pass Validation Summary

### Build & TypeScript
- ✓ `npm run build` - PASSED
- ✓ `npx tsc --noEmit` - No TypeScript errors

### Test Results
- ✓ Total: 269 tests (262 passed, 7 pre-existing failures unrelated to this change)
- ✓ Changed-module tests ALL PASSED:
  - bootTextures.test.ts: 9/9 PASSED
  - platformRendering.test.ts: 1/1 PASSED
  - rewardRendering.test.ts: 2/2 PASSED
  - enemyRendering.test.ts: 3/3 PASSED

### Pre-Existing Baseline Failures (Not Attributable)
- src/styles/app.test.ts - HUD styling (1 failure)
- src/phaser/audio/SynthAudio.test.ts - Audio cues (2 failures)
- src/game/content/stages.test.ts - Stage validation (4 failures)

### Changed Files Verified
- src/phaser/assets/bootTextures.ts - All Slice 1 keys registered ✓
- src/phaser/scenes/GameScene.ts - Player animation resolver wired ✓
- src/phaser/scenes/gameScene/bootstrap.ts - Sprite creation paths updated ✓
- src/phaser/scenes/gameScene/platformRendering.ts - Tile rendering implemented ✓
- src/phaser/scenes/gameScene/gravityRendering.ts - Gravity visuals migrated ✓
- src/phaser/scenes/gameScene/enemyRendering.ts - Hazard visuals migrated ✓
- src/phaser/scenes/gameScene/rewardRendering.ts - Reward visuals migrated ✓
- art.md - Migration checklist and contracts updated ✓

### Archive Ready: YES
- Build passes: ✓
- Changed-module tests pass: ✓
- No change-attributable regressions: ✓
- Baseline failures documented: ✓
- All tasks complete: ✓
