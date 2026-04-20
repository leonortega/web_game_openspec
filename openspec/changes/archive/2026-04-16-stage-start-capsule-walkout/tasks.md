## 1. Fresh-Start Sequence Flow

- [x] 1.1 Update the fresh-stage entry path in `src/phaser/scenes/GameScene.ts` and any required session plumbing so menu starts, replay starts, and normal next-stage auto-advance enter a bounded start sequence with fixed phases for rematerialization, scripted walk-out, capsule close, then active control.
- [x] 1.2 Preserve current checkpoint and mid-stage respawn behavior by proving those paths still bypass the stage-intro replay, start-capsule arrival, and scripted walk-out sequence.

## 2. Shared Capsule Presentation

- [x] 2.1 Reuse or factor shared capsule presentation helpers in `src/phaser/view/capsulePresentation.ts` so the stage-start capsule uses the same shell and door design as the stage-completion exit capsule without regressing exit rendering.
- [x] 2.2 Implement the reversed completion-style appearance effect, deterministic pre-control walk-out, and post-walk door-close beat in `src/phaser/scenes/GameScene.ts` while keeping the start capsule inert and clearly non-interactive after the sequence resolves.

## 3. Regression Coverage And Validation

- [x] 3.1 Update automated coverage for fresh stage starts, next-stage auto-advance, and checkpoint respawns so the walk-out sequence remains present only on fresh starts and control begins only after the capsule closes.
- [x] 3.2 Update or add focused scripted playtest coverage in `scripts/stage-start-capsule-entry-playtest.mjs` and any related exit-capsule validation script needed to confirm exact capsule reuse, reversed effect direction, scripted walk-out, and inert closed final state.
- [x] 3.3 Run `npm test`, `npm run build`, and the relevant stage-start and exit playtests, then fix any regressions introduced by the walk-out implementation.