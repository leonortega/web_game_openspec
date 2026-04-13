## Why

The current stage toolkit can reveal persistent hidden routes, but it cannot author a bounded timing challenge where the player briefly opens a support path and must cross it before it disappears. This change adds scanner-triggered temporary bridges as a narrow extension of the existing reveal-platform and timer patterns, while explicitly deferring broader gravity and platform-control mechanics that would require a larger controller/platform rewrite.

## What Changes

- Add authored scanner switches that activate when the player enters their linked scanner volume, without a new interact button or projectile-only rule.
- Add authored temporary floating bridges that begin hidden and non-solid, become visible and solid when their linked scanner switch activates, and start their countdown on that activation frame.
- Define timer behavior for temporary bridges, including refresh on a later re-trigger, expiry while occupied, and return to hidden and non-solid state after support contact ends.
- Define reset behavior so scanner switches and temporary bridges do not persist through death, checkpoint respawn, manual restart, or fresh attempts.
- Explicitly exclude gravity inversion columns, anti-grav streams, and magnetic platforms from this change because they require a later, broader controller and platform rewrite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: stages gain scanner-triggered temporary bridge routes as a readable timed traversal mechanic alongside existing reveal-platform behaviors.
- `stage-progression`: temporary bridge runtime state and timer reset rules are defined across death, checkpoint respawn, and fresh attempts.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `scripts/stage-playtest.mjs`
- `src/game/simulation/GameSession.test.ts`
- `src/game/simulation/state.test.ts`
- Authored stage layouts that place scanner switches and temporary bridge routes
