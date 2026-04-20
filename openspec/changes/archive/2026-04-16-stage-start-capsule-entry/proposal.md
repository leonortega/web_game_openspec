## Why

Stage starts currently cut from the intro surface directly to active play with the player already present, while valid stage completion gets a readable in-world capsule finish. A short mirrored arrival beat at fresh stage entry can make the start of each level feel more coherent and legible without broadening into respawn or checkpoint flow changes.

## What Changes

- Add a bounded in-world capsule arrival sequence when a level begins from a fresh stage start or automatic progression into the next stage, using the same capsule style and mirrored arrival language as the existing completion finish.
- Keep the stage intro surface readable and timing-stable by handing off into the arrival beat without expanding the transition into a broader presentation system or reintroducing decorative player-figure accents.
- Explicitly exclude checkpoint respawns and other mid-stage re-entry paths so the change stays focused on stage-start presentation and gameplay handoff.
- Keep audio reuse optional and out of scope for this change unless implementation cannot preserve the existing handoff cleanly without a small targeted audio follow-up.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: stage starts should allow a short bounded capsule-arrival appearance beat before normal active control on fresh entry and next-stage auto-advance, while checkpoint respawns remain on their current direct respawn path.
- `stage-transition-flow`: the pre-stage transition flow should hand off cleanly into the new in-world arrival beat without losing stage-status readability or changing the established intro-scene ordering and timing semantics beyond the added bounded appearance step.
- `retro-presentation-style`: stage-start arrival feedback should reuse the exit capsule's visual language in a mirrored, local, retro-styled appearance effect that stays readable and remains distinct from valid exit-only disappearance feedback.

## Impact

- OpenSpec contracts for stage-start flow, transition handoff, and retro presentation around in-world player arrival.
- Likely implementation touchpoints in `src/phaser/scenes/StageIntroScene.ts`, `src/phaser/scenes/GameScene.ts`, `src/game/simulation/GameSession.ts`, and stage-flow or simulation tests that currently assume the player is immediately active at scene start.
- Regression coverage in stage-start flow, next-stage auto-advance flow, and checkpoint respawn flow to confirm the new arrival beat is present only on fresh starts and normal stage advancement.