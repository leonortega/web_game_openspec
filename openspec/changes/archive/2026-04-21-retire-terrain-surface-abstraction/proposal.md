## Why

The game now treats brittle and sticky traversal as full-platform variants, but leftover terrain-surface types, collections, identifiers, and spec wording still imply a separate authored terrain system. That split increases maintenance cost, makes stage authoring harder to read, and creates avoidable drift between platform behavior, runtime state, rendering, and documentation.

This change removes the obsolete terrain-surface abstraction while keeping the existing brittle and sticky mechanics intact. The cleanup is needed now so future stage, rendering, and validation work extends one platform-centric model instead of preserving two overlapping concepts.

## What Changes

- Remove legacy terrain-surface model concepts such as `TerrainSurfaceKind`, `TerrainSurfaceState`, `terrainSurfaces`, `terrainSurfaceIds`, and related render or state helper structures where they still exist as separate abstractions.
- Keep brittle delayed-break and sticky grounded-drag behavior, but define them solely as `platform.terrainVariant` behavior on supported static platforms.
- Replace schema, runtime, renderer, and authored-data references that still point at terrain-surface collections or terrain-surface identifiers with platform-centric references.
- Migrate secret-route, gravity-capsule, and similar authored references away from `terrainSurfaceIds` toward platform-owned identifiers.
- Remove capability wording that still implies a standalone terrain-surface system when the requirement really describes platform variants.
- Preserve the current full-footprint presentation and static-platform-only rule for brittle and sticky variants.
- **BREAKING**: authored data, runtime plumbing, and internal naming that still depend on separate terrain-surface collections or IDs must be updated to the platform-centric model in the same implementation pass.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: Reframe brittle and sticky behavior, authored validation, and related route language around platform-owned variants instead of a separate terrain-surface abstraction.
- `stage-progression`: Replace stage-level wording that still describes terrain-driven pacing or terrain-surface route references when those requirements are fulfilled by platform variants and platform-owned route data.
- `retro-presentation-style`: Replace presentation wording that still implies distinct terrain-surface rendering primitives when the visuals are tied to full-platform variants.

## Impact

Affected areas are expected to include stage content types and builders, stage catalog and validation, simulation state, game-session ingestion, Phaser presentation helpers, authored stage data references, tests, and scripted playtest coverage. The implementation must remove dead terrain-surface schema leftovers without introducing empty replacement fields, overlay rectangles, or behavior regressions in brittle and sticky platform mechanics.