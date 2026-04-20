## Why

Exit completion and stage intro presentation still have a few readability gaps despite recent archived changes. Exit capsules can be authored without explicit support grounding, the finish dematerialization can let part of the player reappear before handoff, and the stage intro still uses a right-side accent that can read like a player figure instead of neutral transition dressing.

## What Changes

- Add explicit authored exit-grounding rules so stage exits stay visually and spatially supported on the intended route instead of floating as raw rectangles without support validation.
- Tighten the bounded exit-finish flow so valid completion keeps the player hidden and non-interactive through the end of the teleport or dematerialization handoff without partial reappearance.
- Remove or restyle the remaining stage-intro accent treatment so the intro surface no longer suggests a decorative astronaut or other player-figure accent.
- Keep the scope limited to authored exit validation, finish cleanup, and transition-surface presentation; do not alter stage ordering, unlock flow, objective gating, or broader gravity-capsule behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: exit requirements should also cover supported, route-grounded exit placement and clean non-reappearing finish resolution through the existing bounded capsule-entry handoff.
- `retro-presentation-style`: exit presentation should keep the stage-completion capsule grounded and readable against traversal capsules while the finish effect resolves cleanly without restoring normal player visibility mid-sequence.
- `stage-transition-flow`: intro-surface accent motion should remain abstract and stage-facing instead of implying a decorative astronaut or player-figure silhouette.

## Impact

- OpenSpec contracts for stage exit authoring, bounded finish presentation, and intro transition presentation.
- Likely implementation touchpoints in `src/game/content/stages.ts`, `src/game/content/stages.test.ts`, `src/game/simulation/GameSession.ts`, `src/game/simulation/GameSession.test.ts`, `src/phaser/scenes/GameScene.ts`, `src/phaser/scenes/StageIntroScene.ts`, `src/phaser/scenes/BootScene.ts`, `scripts/capsule-exit-teleport-finish-playtest.mjs`, and `scripts/stage-playtest.mjs`.
- Regression coverage in authored stage validation, finish-flow simulation tests, and stage intro or stage-flow playtesting.