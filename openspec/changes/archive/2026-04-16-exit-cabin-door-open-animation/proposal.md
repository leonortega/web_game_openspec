## Why

The exit capsule already uses grounded placement and a bounded finish handoff, but it still lacks its own readable door-open beat before the player disappears. Adding that explicit door animation makes the finish sequence easier to read while preserving the current grounded endpoint, teleport clarity, and stage-complete timing.

## What Changes

- Require valid stage completion to trigger a short independent exit-cabin door-open animation as part of the existing finish sequence before the normal stage-clear handoff.
- Preserve the current grounded exit placement, fixed grounded start-cabin behavior, teleport readability, objective gating, and overall stage-complete sequencing.
- Keep the change limited to exit-finish presentation, shared capsule presentation plumbing, and focused regression validation rather than expanding audio scope or altering the start-sequence contract.
- Add validation that proves fresh-stage grounded cabin behavior still holds and that the exit cabin now opens during the finish sequence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: valid exit completion should include a short exit-cabin door-open beat while preserving current grounded endpoint rules, completion gating, and handoff timing.
- `retro-presentation-style`: the stage-exit capsule should communicate completion through an explicit bounded door-open animation that stays distinct from the inert start cabin and keeps the finish readable.
- `stage-transition-flow`: the gameplay-to-results handoff should continue to use the existing stage-clear flow, but only after the bounded in-world exit door-open and teleport finish resolves.

## Impact

- OpenSpec contracts for stage completion flow, stage-exit capsule readability, and gameplay-to-results handoff timing.
- Likely implementation touchpoints in `src/phaser/scenes/BootScene.ts`, `src/phaser/scenes/GameScene.ts`, `src/phaser/view/capsulePresentation.ts`, and any focused tests or playtests that cover stage start and exit finish presentation.
- Validation through the existing build and test pipeline plus targeted stage-flow playtests that confirm grounded start and exit placement remain correct and that the exit door visibly opens during finish.