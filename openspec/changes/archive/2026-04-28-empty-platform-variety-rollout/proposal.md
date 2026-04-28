## Why

Current empty-platform stretches rely too heavily on jump-only timing beats, which narrows traversal expression and makes sections feel repetitive. Expanding platform variety now will improve pacing diversity and route readability while preserving existing stage flow.

## What Changes

- Add broader platform mechanics for empty-platform segments so traversal uses multiple interaction patterns instead of jump-only beats.
- Define requirement-level behavior for directional movement platforms, timed occupancy breaks, and hazard-aware stand zones within empty-platform layouts.
- Require stage progression authoring to distribute mechanic types across early, mid, and late routes so variety ramps predictably.
- Add validation expectations so stage data catches under-varied empty-platform runs before runtime.
- Extend relevant tests to verify mechanic distribution and schema-valid stage authoring.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: Empty-platform sections must support a broader mechanic mix beyond jump-only traversal beats.
- `stage-progression`: Stage progression requirements must enforce variety pacing for empty-platform mechanics across route segments.

## Impact

- Affected systems: stage catalog authoring, stage type definitions, stage validation rules, and associated tests.
- Affected code areas: stage metadata and platform tags, empty-platform sequence generation/authoring helpers, validation pipelines, and unit/integration tests around stage structure.
- No API breaking changes expected for external consumers.
