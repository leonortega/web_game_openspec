## Why

Recent playtesting shows a narrow but player-visible enemy regression: some grounded hoppers appear floating before they move, and some open their first hop by snapping into a fast leftward route even when the authored layout expects a different supported landing. This breaks the grounded-foot-enemy read, makes some hopper encounters feel wrong or unreachable, and risks confusing grounded hoppers with true hovering enemies.

## What Changes

- Tighten grounded hopper and walker expectations so supported foot enemies spawn on real support and do not present as floating enemies.
- Require hopper startup routing to choose a reachable supported landing or wait on support instead of defaulting to a left-biased first hop.
- Keep true flyer enemies on their existing hover behavior and presentation rather than broadening grounded-hopper fallback logic into flyer behavior.
- Add or tighten authored validation and coverage so unsupported grounded hopper spawns, unreachable first-hop setups, and similar authoring defects fail before they reach playtest.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: strengthen supported grounded-enemy authoring, hopper initial routing, and validation expectations while preserving separate flyer hover behavior.

## Impact

- Affects grounded enemy authoring and validation in `src/game/content/stages.ts` and related tests.
- Affects hopper runtime spawn and routing behavior in `src/game/simulation/GameSession.ts` and any related simulation helpers or state.
- Affects automated validation or scripted playtest coverage for unsupported hopper placements and initial route selection.