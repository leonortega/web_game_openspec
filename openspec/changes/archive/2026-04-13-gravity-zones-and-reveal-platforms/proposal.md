## Why

The current stage toolkit does not support authored low-gravity pockets or hidden support routes that reveal through nearby exploration, which limits traversal variety and makes some desired stage beats impossible to express cleanly. This change adds those two mechanics now so stage authors can build clearer airborne route variation and proximity-based discovery without expanding into broader gravity rewrites or unrelated platform gimmicks.

## What Changes

- Add authored rectangular low-gravity zones that reduce player vertical acceleration only while the player is inside the zone.
- Add proximity-triggered reveal platforms that begin hidden and non-solid, reveal when the player enters a linked nearby reveal volume, and then stay visible and solid for the rest of the current attempt or preserved checkpoint state.
- Define the gameplay rule order for low gravity interacting with jump arcs, dash, double jump, springs, and falling-platform escape timing.
- Extend stage data, simulation state, rendering, and automated playtest coverage for both mechanics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: stages gain authored low-gravity traversal zones and reveal-platform routes as readable platform variation tools.
- `player-controller`: player movement rules define how low gravity changes vertical acceleration and how it combines with jumps, dash, springs, and falling-platform escape timing.
- `stage-progression`: reveal-platform state persists across the current attempt and checkpoint respawns only when the checkpoint was activated after the reveal occurred.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `scripts/stage-playtest.mjs`
- `src/game/simulation/GameSession.test.ts`
- `src/game/simulation/state.test.ts`
- Authored stage layouts that need low-gravity zones or reveal-platform placements