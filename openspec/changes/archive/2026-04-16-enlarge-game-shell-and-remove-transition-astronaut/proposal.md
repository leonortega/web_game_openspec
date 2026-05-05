## Why

The current browser shell keeps the playable surface relatively small on larger desktop displays even though the viewport has room to present the game more prominently. The stage intro and completion scenes also still include a decorative astronaut figure that now reads as unnecessary transition clutter for this presentation pass.

## What Changes

- Enlarge the responsive game shell substantially on larger viewports so the rendered play surface occupies more of the desktop window while preserving the existing internal gameplay resolution and Phaser scaling model.
- Update shell presentation requirements so the enlarged layout remains centered, readable, and bounded on smaller screens instead of overflowing or breaking mobile fit.
- Remove the decorative astronaut accent figure from the stage intro and stage completion transition scenes while preserving their current status text, timing semantics, and progression flow.
- Keep the scope limited to transition-scene presentation and shell sizing; do not rename fiction, change gameplay rules, or alter authored stage progression behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-transition-flow`: transition intro and completion surfaces no longer show a decorative astronaut figure and must keep status readability and timing intact without that accent art.
- `retro-presentation-style`: game-facing shell presentation must support a substantially larger centered render area on roomy desktop viewports while remaining responsive and secondary to gameplay readability on constrained screens.

## Impact

- OpenSpec contracts for transition-scene presentation and game-shell sizing behavior.
- Likely implementation touchpoints in `src/phaser/createGameApp.ts`, `src/styles/app.css`, `src/phaser/scenes/StageIntroScene.ts`, and `src/phaser/scenes/CompleteScene.ts`.
- Regression coverage in existing UI tests and browser playtests, including `npm test`, `npm run build`, and stage-flow playtesting.