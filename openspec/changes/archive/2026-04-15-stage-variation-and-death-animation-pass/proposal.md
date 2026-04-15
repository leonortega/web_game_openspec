## Why

Stage variety and defeat feedback are currently uneven across the campaign. Stage 3 contains a misplaced checkpoint after the exit door, Stages 1 and 2 do not yet use the terrain-surface and gravity-field mechanics that now exist elsewhere, and both player and enemy defeat transitions resolve too abruptly to match the game's bounded retro presentation language.

## What Changes

- Remove the Stage 3 checkpoint that is placed after the stage exit so checkpoint progression remains meaningful and safe.
- Expand authored stage variation so Stages 1 and 2 also use existing terrain-surface and gravity-field mechanics through concrete, stage-specific route requirements rather than keeping gravity-field rollout centered only on Stage 3.
- Tighten stage-authoring expectations so each main stage uses distinct combinations of current mechanics to create more imaginative but still testable route shapes, recovery beats, and optional traversal lines.
- Extend the existing state-driven retro presentation system with grounded enemy walk or hop motion, flyer sparkle accents, player defeat blow-apart particles, and enemy defeat dissolve particles.
- Keep all animation work bounded to deterministic pose math, restrained tweens, and local particles rather than introducing a spritesheet AnimationManager pipeline or changing encounter timing.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: terrain-surface and gravity-field rollout must expand beyond the current Stage 3 emphasis and require distinct stage-authored mechanic mixes across the main stages
- `enemy-hazard-system`: grounded enemies and flyers must expose clearer bounded movement states and readable defeat feedback without changing threat cadence
- `player-controller`: player death and respawn flow must expose bounded defeat feedback before respawn without changing damage, checkpoint, or controller semantics
- `stage-progression`: checkpoint placement and stage-validation rules must reject end-of-exit checkpoints and preserve readable progress across the revised stage layouts
- `retro-presentation-style`: short-lived particles and pose-driven defeat accents must cover player and enemy defeat while remaining local, retro, and readability-safe

## Impact

- `src/game/content/stages.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/view/retroPresentation.ts`
- `src/phaser/view/retroPresentation.test.ts`
- `src/phaser/scenes/GameScene.ts`
- `scripts/stage-playtest.mjs`
- Stage authoring and regression coverage for checkpoint placement, terrain metadata, gravity fields, and defeat-feedback presentation