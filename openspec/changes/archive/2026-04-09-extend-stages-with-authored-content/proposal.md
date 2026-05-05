## Why

The previous interpretation of "double the length" stretched the world by scaling authored geometry, which changes the feel of platforms, exits, hazards, and rewards instead of making the stages meaningfully longer. This change corrects that by extending play duration through more authored content and fixing the menu and reward feedback details that still read incorrectly in the UI.

## What Changes

- Revert the stage-length scaling approach and extend each stage with additional authored platforms, enemies, blocks, checkpoints, and pacing beats.
- Keep authored object sizes at their original scale so longer stages come from content density and route structure, not enlarged geometry.
- Preserve the multi-hit coin-block loop, but make each punch reveal a single coin popup for one second before fading out.
- Move the selected-option and run-setting summary out of the top of the menu and into a tiny status line at the bottom-right.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `stage-progression`: stage duration, route length, and pacing must come from additional authored content instead of geometric scaling.
- `interactive-blocks`: coin blocks still require one hit per coin, but each hit must show a single coin reveal for one second and fade out.
- `main-menu`: the current selection and run-setting status must be shown as a compact bottom-right footer instead of a top summary block.

## Impact

- `src/game/content/stages.ts` will need reauthored stage layouts and route pacing.
- `src/game/simulation/GameSession.ts` and `src/phaser/scenes/GameScene.ts` may need reward and reveal behavior adjustments.
- `src/phaser/scenes/MenuScene.ts` will need a footer-style status readout and a reduced top UI.
- `scripts/stage-playtest.mjs` and OpenSpec specs will need updates to reflect the corrected stage-length interpretation.
