## Why

Recent playtesting exposed content safety and movement issues that make the platformer feel unreliable: checkpoints can appear on unsafe footing, some hazards and interactives are not meaningfully reachable, moving platforms reject the player instead of carrying them cleanly, and the HUD splits core gameplay information across the top and bottom of the screen. These problems reduce fairness and readability, so they should be fixed before adding more content.

## What Changes

- Constrain checkpoint placement to safe, stable, reachable locations.
- Constrain hazards and interactive stage elements so they appear on or near reachable gameplay routes.
- Fix moving platform support so the player can stand, walk, and jump from moving platforms without being pushed away unnaturally.
- Consolidate the in-game HUD into a single top-of-screen gameplay bar.

## Capabilities

### New Capabilities
- `gameplay-hud`: Defines the runtime HUD layout for core gameplay stats and top-of-screen presentation.

### Modified Capabilities
- `stage-progression`: Tighten checkpoint safety and authored route readability requirements.
- `platform-variation`: Require moving platforms to support stable traversal and grounded play.
- `enemy-hazard-system`: Require hazard placement to stay within intended reachable encounter space.

## Impact

- Affects authored stage data in `src/game/content/stages.ts`.
- Affects movement and collision behavior in `src/game/simulation/GameSession.ts` and `src/game/simulation/state.ts`.
- Affects HUD rendering and layout in `src/ui/hud/hud.ts` and `src/styles/app.css`.
- May require updated playtest checks in `scripts/stage-playtest.mjs`.
