## ADDED Requirements

### Requirement: Broad helper terrain checks follow platform surface-mechanic and live-scene snapshot truth
The project SHALL keep terrain-related broad automated `Mechanic Checks` coverage aligned with the current platform-owned surface-mechanic contract and the current live-scene debug snapshot contract. When the helper seeds or audits brittle or sticky terrain probes, it MUST use the same `surfaceMechanic.kind` source of truth already exercised by runtime, renderer bootstrap, and runtime fixtures rather than mutating deprecated `terrainVariant` fields as authoritative helper state. Terrain extent and cue assertions MUST derive their pass or fail from stable live-scene snapshot signals mapped back to the authored platform footprint, and the resulting `Mechanic Checks` report notes MUST communicate terrain-specific pass or fail outcomes without folding stale terrain drift into unrelated helper results. This cleanup MUST stay bounded to terrain-related helper failures and MUST NOT broaden into non-terrain `Mechanic Checks` scope.

#### Scenario: Seeding terrain probes for broad helper checks
- **WHEN** broad automated `Mechanic Checks` coverage prepares brittle and sticky terrain probes
- **THEN** the helper seeds those probes through platform-owned `surfaceMechanic.kind`
- **AND** it evaluates terrain results against live-scene snapshot signals that correspond to the same authored platform extents

#### Scenario: Reporting terrain-specific helper outcomes
- **WHEN** terrain-related broad-helper assertions pass or fail during `Mechanic Checks`
- **THEN** the report notes describe terrain extent and terrain-cue outcomes from those terrain-specific assertions
- **AND** those notes stay separate from unrelated non-terrain helper failures in the same bundle