## Why

Transient stage and gameplay messages currently compete with the top HUD because they render at the top center of the play view, which makes objective copy and other short prompts easier to miss on busy scenes and narrower viewports. Defeat feedback is also too generic: stomp kills and Plasma Blaster projectile kills currently collapse into the same enemy-defeat particles, so the game loses a useful readability cue right when the player needs to parse what happened.

## What Changes

- Move transient gameplay and stage-message text out of the top-center lane and into a lower-left safe-area lane that stays readable without overlapping the primary scoreboard HUD.
- Apply that lower-left message lane to stage-start briefings, objective reminders, and other gameplay event messages that already use the transient stage-message flow.
- Add distinct local particle treatments for stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player death while preserving existing defeat, damage, and respawn timing.
- Keep the new message placement and defeat feedback on the current HUD and retro-presentation paths instead of introducing a new overlay system or animation pipeline.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gameplay-hud`: transient gameplay and stage messages move from the top-center playfield overlay into a lower-left safe-area lane while the primary HUD band remains top-aligned.
- `stage-progression`: objective briefings and incomplete-exit reminders continue using the transient stage-message flow, but that flow now has a defined lower-left active-play placement.
- `enemy-hazard-system`: enemy defeat feedback must distinguish stomp defeats from Plasma Blaster projectile defeats without changing encounter fairness or defeat timing.
- `retro-presentation-style`: short-lived defeat effects must use distinct bounded visual treatments for stomp defeats, Plasma Blaster projectile defeats, and player death.
- `player-controller`: the player death presentation must remain a distinct player-only defeat burst that hands off cleanly into the existing respawn flow.

## Impact

- `src/ui/hud/hud.ts`
- `src/styles/app.css`
- `src/game/simulation/GameSession.ts`
- `src/phaser/adapters/sceneBridge.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/view/retroPresentation.ts`
- HUD layout, transient gameplay copy placement, and defeat-feedback coverage across simulation and presentation