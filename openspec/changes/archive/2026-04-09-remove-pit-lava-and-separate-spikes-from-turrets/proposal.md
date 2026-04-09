## Why

The current stage content uses two hazard forms that add maintenance cost without adding distinct gameplay value: `pit` as a black kill block and `lava` as a separate hazard type. At the same time, spikes and turrets can end up sharing the same supported platform, which makes encounters visually crowded and harder to read.

## What Changes

- Remove the `pit` hazard element from authored content and runtime handling.
- Replace all `lava` hazards with `spikes` so the hazard vocabulary stays consistent.
- Reposition spikes or turrets so they do not share the same supported platform area.
- Keep the existing player-death behavior for falling out of bounds, so hole death still works without a dedicated pit hazard.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `enemy-hazard-system`: Remove `pit` and `lava` as authored hazard forms, and tighten the placement rule that keeps spikes and turrets separated on supported platforms.

## Impact

- Affects hazard type definitions and runtime handling in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`.
- Affects hazard rendering in `src/phaser/scenes/GameScene.ts`.
- Affects authored stage data in `src/game/content/stages.ts`.
- Affects encounter spacing validation and any future stage authoring that places spikes near turrets.
