## Why

The current HUD and enemy/reward-block setup can interfere with readability and progression. This change cleans up the HUD, prevents authored block placements that can lock the player against stompable enemies, makes power pickup states more visually distinct, and delays shooter feedback until the enemy is actually on screen.

## What Changes

- Move the `Run` and `Segment` status out of the main HUD and into tiny bottom-right text.
- Keep `Stage`, `Coins`, `Health`, and `Power` in a clean horizontal top HUD row.
- Prevent reward blocks that contain coins or powers from being authored over stompable enemies in the same lane where they could block progression.
- Give each supported power a distinct player appearance variant instead of only changing HUD text.
- Make shooter/turret enemies stay silent and stop showing bullets until they are visible in the camera view.

## Capabilities

### New Capabilities
- `player-power-visual-variants`: distinct player color or asset presentation for each active power.

### Modified Capabilities
- `gameplay-hud`: the HUD layout changes so secondary `Run` and `Segment` text is demoted out of the core status row.
- `interactive-blocks`: authored reward blocks gain placement restrictions to avoid overlap with stompable enemies that would create a progression lock.
- `enemy-hazard-system`: shooter enemies gain visibility-gated firing behavior so bullets are not emitted while off-camera.

## Impact

Affected code includes the gameplay HUD renderer, stage/authored block validation, player visual state handling, enemy shooter AI, camera visibility checks, and bullet/audio emission timing.
