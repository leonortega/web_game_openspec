## Why

Stages already use moving platforms, unstable footing, low-gravity pockets, reveal routes, and temporary bridges to vary traversal, but they do not yet support a bounded pair of alien-biome terrain surfaces that change how the player reads ground itself. This change is needed now to add brittle crystal floors and sticky sludge surfaces with precise authored rules, reset behavior, and verification coverage before surface-specific stage content expands further.

## What Changes

- Add authored brittle crystal floor surfaces that arm only from top-surface contact, show a short readable warning, and become broken only after that delay with fair support behavior if the player is still standing on them at expiry.
- Add authored sticky sludge surfaces that slow grounded acceleration and top speed and reduce grounded jump launch strength without rewriting jump buffering, coyote time, spring launch, dash, or low-gravity controller semantics.
- Extend stage metadata, validation, renderer/simulation sync expectations, fixture coverage, and playtest coverage so the new surface types stay bounded and testable across implementation.
- Define brittle crystal reset behavior as live traversal state that resets on death, checkpoint respawn, manual restart, and fresh attempts instead of persisting broken floors through checkpoint recovery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: add brittle crystal floor and sticky sludge traversal-surface behavior to authored platform variation rules.
- `player-controller`: define how sticky sludge modifies grounded movement and jump initiation while preserving coherent interactions with buffered jumps, coyote time, springs, dash, and low-gravity zones.
- `stage-progression`: define brittle-floor reset behavior across attempt and checkpoint flow and add validation and playtest expectations for authored terrain-surface metadata.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/simulation/state.test.ts`
- `scripts/stage-playtest.mjs`
- Authored stage fixtures that add brittle crystal and sticky sludge sections