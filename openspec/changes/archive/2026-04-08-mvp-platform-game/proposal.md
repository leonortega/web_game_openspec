## Why

The project needs a concrete, implementation-ready game definition before building a browser platformer. Defining the MVP now reduces scope creep and sets a clear contract for player movement, level progression, and enemy interactions.

## What Changes

- Define the MVP gameplay loop for a 2D web platform game centered on movement, jumping, hazards, and short level completion.
- Introduce a player-controller capability covering traversal, damage, death, and checkpoint respawn behavior.
- Introduce a stage-progression capability covering level structure, collectibles, exits, and progression through a compact sequence of stages.
- Introduce an enemy-hazard-system capability covering simple enemies, environmental hazards, and the expected player interactions with them.

## Capabilities

### New Capabilities
- `player-controller`: Defines the player movement model, jump behavior, health/damage handling, and respawn flow.
- `stage-progression`: Defines stage goals, checkpoints, collectibles, completion rules, and progression across the MVP level set.
- `enemy-hazard-system`: Defines enemy archetypes, hazard behavior, and how the player avoids or defeats threats.

### Modified Capabilities

None.

## Impact

- Establishes the functional contract for the first playable version of the web game.
- Drives new specs under `openspec/changes/mvp-platform-game/specs/`.
- Provides the basis for later implementation planning around a 2D browser stack such as Phaser, TypeScript, and Vite.
