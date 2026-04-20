## 1. Stage-start capsule behavior

- [x] 1.1 Update fresh stage-start flow in `src/phaser/scenes/GameScene.ts` so intro-driven stage entry still runs the bounded arrival beat but leaves behind a grounded inert start capsule after player reveal.
- [x] 1.2 Update `src/phaser/view/capsulePresentation.ts` so the start capsule supports a short post-reveal door-close animation and a resolved closed inert state that stays visually distinct from exit and gravity capsules.
- [x] 1.3 Ensure the persistent start capsule remains non-interactive, does not affect traversal or completion logic, and does not reuse exit-only disappearance semantics.

## 2. Spawn-path guards

- [x] 2.1 Keep the persistent start capsule and arrival sequence gated to fresh stage starts and next-stage auto-advance only.
- [x] 2.2 Confirm checkpoint respawns within the same stage attempt do not replay the stage-start arrival and do not recreate the persistent start capsule.

## 3. Validation

- [x] 3.1 Update `scripts/stage-start-capsule-entry-playtest.mjs` to verify fresh-stage arrival, bounded door-close timing, persistent inert capsule presence, and checkpoint-respawn exclusion.
- [x] 3.2 Update `scripts/stage-playtest.mjs` only if needed so broader stage-flow coverage still reflects the fresh-start-only capsule behavior.
- [x] 3.3 Run the relevant playtests and fix any regressions in stage-start, respawn, or capsule-distinction behavior before closing the change.