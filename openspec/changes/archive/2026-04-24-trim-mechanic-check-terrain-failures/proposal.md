## Why

Broad helper terrain coverage inside `Mechanic Checks` still seeds probe fixtures through deprecated `terrainVariant` mutations and still judges terrain visuals through narrow shape heuristics that have drifted from the current live-scene snapshot contract. Runtime, renderer, and existing runtime tests already use `surfaceMechanic.kind` as the terrain source of truth, so the remaining helper path now produces stale terrain-related failures and noisy report notes.

## What Changes

- Align broad helper terrain probe fixture setup with the platform-owned `surfaceMechanic.kind` contract already used by simulation, rendering, and runtime fixtures.
- Replace stale terrain extent and cue assertions in the broad helper path with checks derived from the current live-scene debug snapshot contract so terrain-related `Mechanic Checks` notes only fail on real terrain drift.
- Keep the cleanup bounded to terrain-related `Mechanic Checks` failures and notes in the broad helper path, without widening into falling-platform, gravity-field, or other non-terrain checks.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stage-progression`: add a focused contract for terrain-related broad-helper `Mechanic Checks` coverage so helper fixtures, assertions, and report notes follow `surfaceMechanic.kind` and the live-scene snapshot truth.
- `platform-variation`: replace the remaining stale `terrainVariant` wording in live brittle/sticky rollout requirements with the current platform-owned surface-mechanic contract.

## Impact

- `scripts/stage-playtest.mjs`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/gameScene/bootstrap.ts`
- `src/game/simulation/GameSession.test.ts`
- `openspec/specs/stage-progression/spec.md`
- `openspec/specs/platform-variation/spec.md`