## Why

The current retro presentation stack already applies global CRT and quantization treatment, but the remaining moment-to-moment effects still lean on tint swaps, alpha toggles, and other low-information shortcuts. Enemy color variants do not yet read like palette-swapped sprite families, player and enemy hits do not yet have a strong object-local flash language, and there is no bounded contract for small water or heat shimmer accents that evoke classic 16-bit presentation tricks without turning into a full-screen post-processing pass.

This change defines those effects as a focused presentation-layer follow-up. It keeps Beam, shader, and post-processing usage secondary to readability, local to authored objects or scenery patches, and explicitly outside HUD warping, gameplay telegraph ownership, and simulation changes.

## What Changes

- Add a bounded retro postfx contract for supported enemy palette-ramp variants so enemy color families can read as palette-swapped sprite variants rather than plain tint multipliers.
- Add short object-local hit-flash presentation for the player and supported enemies, preserving silhouette, power-state readability, and existing damage or defeat semantics.
- Add authored localized water and heat distortion accents for safe scenery or non-mechanical surfaces only, with explicit guardrails against HUD warping, full-camera distortion, or invented traversal mechanics.
- Route these effects through the existing Phaser presentation and render-plugin surface rather than a shader-first renderer rewrite.
- Define focused validation expectations for effect routing, teardown, HUD exclusion, and unchanged gameplay behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retro-presentation-style`: bounded Beam and post-processing accents may support palette-ramp variants, object-local hit flashes, and localized scenery shimmer without becoming dominant or global.
- `enemy-hazard-system`: supported enemy variants may use bounded palette-ramp treatment and short local hit flashes while preserving the existing threat contract.
- `player-controller`: surviving hits and defeat presentation may use a short object-local player hit flash without changing damage, invincibility, or respawn semantics.
- `player-power-visual-variants`: player hit flash treatment must preserve the readability of the current base or powered astronaut variant.
- `gameplay-hud`: gameplay HUD and transient message lanes must remain outside world-local distortion and other bounded postfx regions.
- `platform-variation`: authored water or heat shimmer accents may decorate safe scenery or non-mechanical surfaces without inventing new platform behavior.

## Impact

- `src/phaser/createGameApp.ts`
- `src/phaser/retroPostFx.ts`
- `src/phaser/plugins/EnhancedRenderPlugin.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/gameScene/enemyRendering.ts`
- `src/phaser/view/retroPresentation.ts`
- Focused tests near render-plugin plumbing, retro presentation helpers, and scene-level effect routing
- Validation via focused touched-surface tests and `npm run build`, with repo-wide `npm test` treated as informational while unrelated baseline failures remain outside this change