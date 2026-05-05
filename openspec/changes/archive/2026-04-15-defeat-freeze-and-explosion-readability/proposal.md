## Why

The archived defeat-particle visibility pass fixed layering and class separation, but live defeats still under-read because the victim hides immediately and the current burst is too small and short-lived to carry the moment. This follow-up tightens only the presentation layer so player and enemy defeats remain readable without changing defeat resolution, control semantics, or respawn cadence.

## What Changes

- Keep defeated enemies and the player visible for a short bounded defeat hold before hiding them so the event can register in motion.
- Add a brief victim-side defeat tween and flash treatment that reads immediately even before particles complete.
- Replace the current tiny defeat burst with a larger, brighter, longer-lived bounded explosion treatment using the existing procedural retro-particle path rather than introducing a new spritesheet asset pipeline.
- Preserve distinct stomp, Plasma Blaster, and player-death presentation classes while keeping them in the same restrained retro motion family.
- Preserve gameplay semantics, enemy resolution timing, and respawn cadence by keeping all changes in presentation-layer visibility and tween routing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retro-presentation-style`: defeat feedback must include a short local victim-visible hold plus a stronger bounded explosion treatment that stays readable without becoming spectacle.
- `player-controller`: player death presentation must keep the player visible briefly in a non-controllable defeat state, play a bounded defeat tween/flash, and preserve the existing respawn handoff.
- `enemy-hazard-system`: supported enemy defeats must keep the victim visible briefly for a local defeat tween/flash before hiding, while preserving existing encounter timing and defeat-cause distinctness.

## Impact

- `src/phaser/scenes/GameScene.ts`
- `src/phaser/view/retroPresentation.ts`
- `src/phaser/scenes/BootScene.ts`
- Possible regression coverage in `src/phaser/view/retroPresentation.test.ts` and `src/game/GameSession.test.ts`
- Defeat feedback routing, victim visibility timing, procedural explosion presets, and bounded tween presentation across supported defeat causes