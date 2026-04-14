## Why

The game now has an Atari 2600-inspired baseline for gameplay-facing presentation, but the main menu still reads as a separate modern surface and the current retro pass remains smoother and less quantized than intended. A bounded second pass is needed to unify menu presentation with the retro direction and to tighten palette and motion treatment across gameplay-facing scenes without changing gameplay behavior, timing, progression, or authored content.

## What Changes

- Restyle the main menu root and help-facing presentation to use the shared retro visual language instead of the current separate modern green/amber treatment.
- Tighten the existing retro presentation in gameplay-facing scenes through harsher palette quantization, flatter fills, and tighter sprite-like visual motion limits.
- Preserve all existing mechanics, simulation rules, scene flow, authored stage content, progression semantics, and menu behaviors while applying the new presentation pass.
- Update regression coverage so menu interactions, gameplay readability, and unchanged timing-sensitive flows remain verifiable after the visual tightening.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retro-presentation-style`: define the second-pass tightening for active gameplay visuals as harsher palette quantization and stricter sprite-like motion limits without gameplay changes
- `main-menu`: restyle menu presentation to the shared retro language while preserving existing controls and help access
- `gameplay-hud`: tighten the HUD's retro treatment and readability rules under the harsher palette and motion pass
- `stage-transition-flow`: tighten intro and completion screen presentation while preserving existing scene flow timing and progression meaning
- `player-power-visual-variants`: keep power silhouettes and accents readable under the tighter quantized presentation and motion limits
- `enemy-hazard-system`: keep hazards, telegraphs, and enemy states readable under the tighter quantized presentation without changing encounter cadence

## Impact

- `src/phaser/scenes/MenuScene.ts`
- `src/game/view/retroPresentation.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/StageIntroScene.ts`
- `src/phaser/scenes/CompleteScene.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/game/view/hud.ts`
- `styles/app.css`
- `src/game/state.ts` only if existing presentation state wiring needs bounded reuse
- `scripts/stage-playtest.mjs`