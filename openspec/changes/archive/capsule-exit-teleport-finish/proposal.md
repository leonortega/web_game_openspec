## Why

The current stage exit resolves as an immediate overlap with only a dimmed door prop, which makes the end of a run feel abrupt compared to the rest of the game's authored retro feedback. A short capsule-entry teleport beat can make stage completion more readable and satisfying without changing the broader clear flow or unlocking rules.

## What Changes

- Refresh the exit presentation from a static door-like prop toward a grounded capsule-style endpoint that still uses the current completion collision semantics unless a small bounded state extension is required for the effect.
- Add a short in-game teleport or dematerialization sequence when the player completes a stage so the player visibly enters the capsule, disappears, and then hands off to the normal completion scene.
- Add a dedicated original synthesized capsule-entry teleport cue that plays at the moment of exit completion and remains distinct from the existing generic stage-clear feedback.
- Keep the change scoped to exit presentation, bounded completion-state timing, and completion audio identity rather than altering stage ordering, unlock flow, checkpoint behavior, or objective gating.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: stage completion should allow a short readable capsule-entry teleport finish before the normal stage-clear handoff while preserving valid-exit gating and progression semantics.
- `audio-feedback`: stage completion should emit a distinct synthesized capsule-entry teleport cue at exit contact rather than relying only on the generic completion feedback.
- `retro-presentation-style`: the exit-completion dematerialization effect should use a bounded retro visual treatment that handles the multipart player cleanly without obscuring nearby route information.

## Impact

- OpenSpec contracts for exit completion presentation, completion audio identity, and bounded retro completion effects.
- Likely implementation touchpoints in `src/phaser/scenes/BootScene.ts`, `src/phaser/scenes/GameScene.ts`, `src/game/simulation/GameSession.ts`, `src/audio/audioContract.ts`, `src/phaser/audio/SynthAudio.ts`, and `src/game/simulation/GameSession.test.ts`.
- Regression coverage in gameplay simulation and stage-flow validation, including `npm test`, `npm run build`, and a stage completion playtest that confirms the capsule-entry teleport resolves before the normal completion scene handoff.