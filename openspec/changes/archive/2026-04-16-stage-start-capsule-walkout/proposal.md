## Why

The current stage-start capsule arrival establishes a bounded spawn beat, but it still reads as a looser start-only variant instead of the same authored device the player uses at stage completion. Tightening that flow around exact exit-capsule reuse, a reversed completion-style appearance, and a short scripted walk-out makes stage starts feel more intentional without widening into checkpoint, control, or audio-system changes.

## What Changes

- Update fresh stage starts and normal next-stage auto-advance so the opening capsule uses the same visual design family as the stage-completion exit capsule rather than a separate start-specific look.
- Require the player to appear through the same finish-effect language used at stage completion, but reversed into a bounded arrival effect that stays distinct from exit-only disappearance semantics.
- Add a short deterministic pre-control walk-out beat after the player appears so the astronaut exits the capsule automatically before the capsule door closes and active play begins.
- Keep checkpoint respawns, restart semantics, objective gating, and broader audio ownership unchanged so the change stays narrowly focused on stage-start presentation and bounded handoff timing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: fresh stage starts should resolve through an exact exit-capsule-style arrival, a scripted pre-control walk-out, and a short capsule close beat before gameplay becomes active, while checkpoint respawns remain on their current direct path.
- `stage-transition-flow`: the pre-stage transition surface should still hand off automatically and readably into gameplay, but that handoff now includes the deterministic capsule walk-out beat before control starts.
- `retro-presentation-style`: the persistent start capsule should reuse the stage-exit capsule design and reversed finish-effect language while staying identifiable as arrival-only infrastructure through timing, inert closed state, and non-interactive behavior.

## Impact

- OpenSpec contracts for fresh stage-start flow, intro-to-gameplay handoff timing, and capsule presentation distinctions between arrival, traversal, and completion.
- Likely implementation touchpoints in `src/phaser/scenes/GameScene.ts`, `src/phaser/view/capsulePresentation.ts`, `src/game/simulation/GameSession.ts`, `scripts/stage-start-capsule-entry-playtest.mjs`, and possibly `scripts/capsule-exit-teleport-finish-playtest.mjs`.
- Regression coverage for menu-to-stage start, replay start, normal next-stage auto-advance, and checkpoint respawn so the walk-out remains deterministic and scoped only to fresh starts.