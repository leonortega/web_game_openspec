## Why

The current stage-start capsule sequence is visually close to the intended arrival cabin, but its layout still depends on the player spawn rectangle and scene-side reapplication instead of a separately authored grounded world prop. That coupling makes the cabin feel like part of the player spawn effect rather than a fixed stage object, which conflicts with the requested presentation of a cabin that stays on the floor as its own inert piece of world geometry before, during, and after the start sequence.

## What Changes

- Require fresh stage starts to treat the start cabin as a static grounded world prop with its own authored or otherwise stage-fixed anchor instead of deriving cabin placement from the player rectangle.
- Require the player to rematerialize inside that fixed start cabin, walk out through a short deterministic pre-control sequence, and leave the cabin behind as a closed inert grounded prop once active play begins.
- Keep the arrival sequence scoped to fresh stage entry and normal next-stage auto-advance while preserving the existing checkpoint respawn bypass.
- Keep the change narrowly focused on start-cabin placement, sequence ownership, and grounded presentation without expanding audio scope or unrelated stage-data systems unless a minimal anchor field is required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: the fresh-stage arrival cabin must remain a separate grounded prop at a fixed stage position while the player rematerializes inside it, walks out, and gains control only after the cabin closes; checkpoint respawns must continue to bypass this sequence.
- `retro-presentation-style`: the persistent start cabin must read as a grounded inert prop distinct from the player and must remain on supported stage footing before, during, and after the arrival beat.
- `stage-transition-flow`: the pre-stage handoff must still flow automatically into gameplay, but its bounded in-world arrival now resolves through a fixed cabin anchor rather than player-derived cabin placement.

## Impact

- OpenSpec contracts for fresh-stage arrival behavior, grounded start-cabin presentation, and intro-to-gameplay handoff semantics.
- Likely implementation touchpoints in `src/phaser/view/capsulePresentation.ts`, `src/phaser/scenes/GameScene.ts`, and any minimal stage or simulation plumbing needed to provide a separate static start-cabin anchor.
- Focused coverage updates for fresh starts, next-stage auto-advance, and checkpoint respawns, plus targeted playtests that verify grounded static cabin placement and player walk-out sequencing.