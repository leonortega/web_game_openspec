## 1. Defeat Hold And Tween Routing

- [x] 1.1 Update the `GameScene` defeat flow so supported enemy defeats and player death keep the victim visible for the bounded presentation-only hold window while interaction, defeat resolution, and respawn scheduling remain unchanged
- [x] 1.2 Add a shared victim-side defeat tween or flash helper with cause-specific presets for stomp, Plasma Blaster, and player death

## 2. Explosion Readability Pass

- [x] 2.1 Expand the retro-presentation defeat presets and any required boot-generated textures so the current 4x4 burst becomes a larger, brighter, longer-lived bounded local explosion without adding a spritesheet asset pipeline
- [x] 2.2 Ensure stomp, Plasma Blaster, and player-death effects remain visually distinct, render above ordinary gameplay objects, and fully resolve within the agreed short presentation window

## 3. Coverage And Validation

- [x] 3.1 Update `src/phaser/view/retroPresentation.test.ts` and `src/game/GameSession.test.ts` coverage for victim-visible hold windows, class-distinct defeat feedback, and unchanged respawn cadence
- [x] 3.2 Verify in active play that mixed encounters still read clearly while the victim hold, tween, and stronger explosion remain local and presentation-only