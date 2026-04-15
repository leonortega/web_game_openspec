## Why

The current retro gameplay presentation still reads as an early coarse pass rather than a readable, denser 8-bit look, and two intended audio behaviors are not landing reliably in runtime: the menu can fail to play audible title music, and enemies can enter view without the threat-presence cues the player expects. A single combined polish change is needed now so the visual direction, menu music ownership, and viewport-driven enemy audibility are specified together without reopening unrelated active menu or stage-layout work.

## What Changes

- Tighten gameplay-facing presentation so the player, enemies, terrain, and stage backdrops move from the current coarse Atari-like pass toward denser readable 8-bit pixel treatment while preserving silhouette clarity, route readability, and foreground versus background separation.
- Strengthen player and threat presentation requirements so added pixel detail improves recognition instead of blurring powers, telegraphs, projectiles, or hazard states.
- Clarify the existing menu-music contract as a runtime-fix requirement: once audio is unlocked, the designated title track must become audibly active and remain owned by the menu until another scene takes over.
- Require enemy audibility to begin when a threat becomes view-relevant, using viewport-aware motion or presence cues that stay selective and preserve the existing turret off-screen suppression behavior and lead-margin exception.
- Add validation expectations that cover readable 8-bit presentation updates plus the corrected menu-music and enemy-audibility runtime behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retro-presentation-style`: move active gameplay visuals toward denser 8-bit sprite and tile detail while preserving readability-safe backdrop separation.
- `player-power-visual-variants`: require the astronaut base and power variants to gain readable pixel detail and power-specific accents without losing gameplay-scale clarity.
- `enemy-hazard-system`: require enemies and hazards to remain readable under the denser 8-bit pass and define viewport-aware enemy audibility without changing attack timing or the existing turret visibility exception.
- `audio-feedback`: clarify corrected menu-music playback behavior and add selective enemy motion or presence cues that begin once relevant threats enter view.
- `main-menu`: treat audible title music after browser audio unlock as required runtime behavior of the existing menu capability.

## Impact

- OpenSpec contracts for gameplay presentation, player visuals, enemy readability, menu music ownership, and enemy-audio timing.
- Likely implementation touchpoints in `src/game/`, `src/phaser/scenes/`, `src/phaser/audio/`, and gameplay-facing rendering helpers.
- Regression and playtest coverage for menu audio unlock, scene music ownership, viewport-driven enemy cues, and readability of denser 8-bit foreground and backdrop rendering.
- Coordination with archived retro-presentation and audio-polish changes, while leaving active `main-menu-simplification` and `stage-layout-safety-and-turret-telegraph` out of scope.