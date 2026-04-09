## Why

The current platformer has a solid MVP loop, but its traversal, combat, and feedback systems top out early because stages rely on static terrain, a small enemy set, and no power or audio progression. Expanding those systems now gives the game clearer biome identity, stronger player growth, and more varied moment-to-moment decisions without discarding the existing level structure.

## What Changes

- Add dynamic terrain capabilities such as moving, unstable, and traversal-modifying platforms.
- Add lightweight player power progression tied to stage or collectible milestones.
- Add stage music and event-driven sound effects for action readability and reward feedback.
- Extend enemy and hazard requirements to support additional combat roles and readable mixed encounters.
- Extend player controller and stage progression requirements to support unlockable abilities, terrain-driven pacing, and collectible-backed progression.

## Capabilities

### New Capabilities
- `platform-variation`: Dynamic terrain and special platform behaviors that change traversal pacing.
- `player-progression`: Unlockable player powers and visible progression state across stages.
- `audio-feedback`: Music and sound feedback for player actions, danger telegraphs, and progression events.

### Modified Capabilities
- `enemy-hazard-system`: Add expanded enemy roles and readability requirements for mixed encounters.
- `player-controller`: Extend the controller to support progression-gated abilities on top of base movement.
- `stage-progression`: Add terrain-driven pacing and collectible-backed progression requirements.

## Impact

- Affects stage content authoring in `src/game/content/stages.ts`.
- Affects runtime simulation and collision behavior in `src/game/simulation/GameSession.ts` and `src/game/simulation/state.ts`.
- Affects rendering and player feedback in `src/phaser/scenes/*.ts` and `src/ui/hud/hud.ts`.
- Introduces audio asset loading and playback behavior in the Phaser scene layer.
