## Why

The fresh stage-start capsule already mirrors the exit capsule structurally, but it still renders through separate rectangle pieces instead of the same authored exit art treatment. Tightening that last gap makes the start cabin read as the exact same device the player later reaches at stage completion without widening the change into timing, checkpoint, or audio work.

## What Changes

- Require fresh stage starts and normal next-stage auto-advance to render the grounded start cabin with the same dedicated shell, door, and base art treatment used by the stage-completion exit capsule instead of a start-only approximation.
- Keep the current fixed grounded start-cabin placement, rematerialization, scripted walk-out, and inert closed-door end state, but require exact art reuse to preserve visual parity with the exit.
- Preserve existing timing, control lock, checkpoint bypass, checkpoint respawn behavior, and audio ownership so the change remains limited to capsule art reuse and regression validation.
- Add focused validation that proves the start sequence still behaves the same while using the exit-capsule art path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: fresh stage-start arrival should reuse the exact exit-capsule art treatment while preserving the current grounded fixed-cabin sequence, checkpoint bypass rules, and pre-control walk-out contract.
- `retro-presentation-style`: the start cabin should render through the same authored exit-capsule art path rather than separate start-only rectangle pieces while still reading as arrival-only infrastructure through behavior and timing.

## Impact

- OpenSpec contracts for fresh-stage arrival presentation and retro capsule readability.
- Likely implementation touchpoints in `src/phaser/scenes/BootScene.ts`, `src/phaser/scenes/GameScene.ts`, `src/phaser/view/capsulePresentation.ts`, and `src/phaser/view/capsulePresentation.test.ts`.
- Focused regression coverage in `scripts/stage-start-capsule-entry-playtest.mjs`, `scripts/capsule-exit-teleport-finish-playtest.mjs`, and the existing test/build pipeline.