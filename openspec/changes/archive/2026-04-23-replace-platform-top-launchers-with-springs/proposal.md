## Why

Current shipped catalog has only two authored launchers, and both sit on static support platforms where route readability comes from the whole green contact surface rather than from a narrower directional launcher footprint. User wants those shipped platform-top launch beats restored to spring platforms without rolling back bounce-pod or gas-vent support everywhere else.

## What Changes

- Replace current shipped catalog platform-top launcher beats with spring platforms in the authored stage catalog.
- Update spec language so shipped green contact-launch surfaces on support platforms prefer full-footprint springs instead of bounded bounce-pod or gas-vent overlays.
- Keep bounce-pod and gas-vent mechanics available as distinct authored launchers for future or fixture use.
- Update validation and automated coverage expectations so launcher support remains tested even if current shipped catalog contains no launcher annotations.

## Capabilities

### New Capabilities

### Modified Capabilities
- `platform-variation`: restore current shipped support-platform green launch beats to spring-platform readability while keeping bounce pods and gas vents as separate mechanics.
- `stage-progression`: stop treating spring authoring as invalid launcher-era residue and keep launcher validation and regression coverage working without depending on shipped-stage launcher placements.

## Impact

- `src/game/content/stages/catalog.ts`
- `src/game/content/stages/validation.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.test.ts`
- `openspec/specs/platform-variation/spec.md`
- `openspec/specs/stage-progression/spec.md`