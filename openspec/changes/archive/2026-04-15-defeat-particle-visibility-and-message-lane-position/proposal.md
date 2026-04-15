## Why

The archived lower-left message and defeat-particle pass established the right behavior classes, but live gameplay still does not read reliably. Transient messages sit farther from the bottom-left edge than intended, and defeat particles can disappear into the gameplay stack or read too weakly to serve as dependable feedback in motion.

## What Changes

- Tighten the transient gameplay-message placement contract so the active-play lane sits closer to the bottom-left edge while remaining safely on-screen and clear of persistent HUD or readout overlaps.
- Tighten the defeat-feedback contract so stomp, Plasma Blaster projectile, and player-death particles remain clearly visible in live gameplay instead of disappearing behind ordinary gameplay objects.
- Preserve the existing distinct defeat classes while allowing bounded readability tuning to particle strength, density, spread, contrast, or lifetime where needed.
- Preserve gameplay semantics, defeat resolution, damage handling, and respawn cadence while refining only presentation-layer readability.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gameplay-hud`: transient gameplay and stage messages must anchor nearer the bottom-left safe area while staying on-screen and clear of persistent HUD or readout overlaps.
- `stage-progression`: objective briefings and incomplete-exit reminders must continue using the transient message flow, but that flow now has a tighter bottom-left lane placement contract.
- `retro-presentation-style`: short-lived defeat effects must stay clearly visible above the ordinary gameplay stack and remain readability-safe during active play.
- `enemy-hazard-system`: stomp and Plasma Blaster enemy-defeat feedback must stay visibly distinct and readable in mixed encounters without changing encounter timing.
- `player-controller`: the player-death burst must remain clearly visible and distinct while preserving the existing respawn handoff.

## Impact

- `src/styles/app.css`
- `src/phaser/view/retroPresentation.ts`
- `src/phaser/scenes/GameScene.ts`
- Possible regression coverage in `src/styles/app.test.ts` and `src/phaser/view/retroPresentation.test.ts`
- HUD safe-area placement, defeat-particle layering, and bounded live-readability tuning across the existing gameplay and presentation flow