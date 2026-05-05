## Why

The current player avatar and stage backdrops satisfy the retro readability baseline, but they do not sell the intended astronaut-on-alien-world fantasy strongly enough, and the player death presentation can leave the avatar visually broken after respawn. This change refreshes those presentation systems together so the game reads as a more human-like astronaut adventure across extraterrestrial spacescapes while keeping gameplay silhouettes, hazards, and route contrast intact.

## What Changes

- Refresh the base astronaut and supported power variants from the current blocky rectangle-composed look to a more human-like retro astronaut silhouette with clearer helmet, limb, and suit segmentation that still fits the procedural Phaser presentation path.
- Preserve power readability by carrying the new astronaut structure across idle, movement, airborne, and defeat states without changing hitboxes, controller timing, or power semantics.
- Replace the current generic procedural backdrop treatment with planetary and extraterrestrial spacescape motifs such as horizon bands, crater silhouettes, distant planets, ring arcs, and sparse stars that stay visually secondary to playable terrain and hazards.
- Require the player defeat and respawn flow to restore the full avatar visual state so no broken or partially detached body parts persist after the defeat animation ends.
- Treat the provided astronaut and background references as style direction only; the apply phase must create original retro presentation work and must not trace, copy, or directly reproduce the reference images.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-power-visual-variants`: update the astronaut presentation requirements so the base suit and supported power variants read as more human-like retro astronauts, preserve readability across bounded pose states, and recover cleanly after defeat and respawn.
- `player-controller`: update respawn presentation requirements so the death animation can temporarily break apart the avatar but MUST restore the full player visual composition before active play resumes.
- `retro-presentation-style`: update backdrop and presentation requirements so stages render extraterrestrial spacescape scenery that stays subordinate to gameplay readability and is derived from bounded authored palette inputs rather than copied reference art.

## Impact

- `src/phaser/scenes/GameScene.ts`
- `src/phaser/view/retroPresentation.ts`
- `src/phaser/scenes/BootScene.ts` if new generated textures are needed for astronaut parts or backdrop motifs
- `src/game/stages.ts` or equivalent stage palette/backdrop input definitions
- Transition or menu scenes that reuse the shared backdrop helper
- Presentation coverage around player visuals, defeat reset flow, and backdrop readability