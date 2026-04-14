## Why

Some stages already describe relay, beacon, and liftwork fiction, but the runtime still treats stage completion as immediate exit contact with no tracked objective progress. That leaves the authored fiction disconnected from play and limits stage variety to traversal-only completion beats.

## What Changes

- Add lightweight authored stage objectives that track a small set of in-stage mission states such as restoring beacons, reactivating relays, or powering lift towers.
- Allow only stages that explicitly author one of these objectives to gate exit completion until the required objective progress is complete.
- Reuse existing contact, volume, activation, and transient stage-message patterns instead of introducing a separate mission system or new interaction model.
- Keep the rollout bounded to a small authored subset of stages, with validation and regression coverage for objective progress, exit gating, and stage-flow messaging.

## Capabilities

### Modified Capabilities
- `stage-progression`: stage completion flow can include a lightweight authored objective gate before the exit completes on selected stages.

## Impact

- Authored stage data and validation in `src/game/content/stages.ts`.
- Runtime stage-state and completion flow in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`.
- Scene and UI surfaces that bridge objective progress or completion messaging, including `src/phaser/adapters/sceneBridge.ts`, `src/phaser/scenes/StageIntroScene.ts`, `src/phaser/scenes/CompleteScene.ts`, and `src/ui/hud/hud.ts` if objective status needs existing HUD support.
- Regression coverage and scripted playtest flow for objective progression and exit gating.