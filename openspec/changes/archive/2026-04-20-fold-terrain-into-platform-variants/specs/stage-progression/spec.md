## ADDED Requirements

### Requirement: Authored brittle and sticky data migrates to platform variants only
The game SHALL migrate authored brittle crystal and sticky sludge content away from separate `terrainSurfaces` overlays and onto full-platform variant data before runtime setup. Supported stage data for these terrain types MUST identify the variant on the platform itself, MUST use that one platform record as the source of truth for validation, runtime, and rendering, and MUST reject legacy overlay authoring for brittle or sticky terrain. This migration MUST include authored stage catalog data, builders, validation fixtures, runtime fixtures, and scripted playtest fixtures that currently assume overlay rectangles.

#### Scenario: Loading legacy overlay-authored brittle or sticky terrain
- **WHEN** a stage still defines brittle crystal or sticky sludge through separate terrain-surface overlays
- **THEN** authored validation rejects that stage data before runtime use

#### Scenario: Loading migrated platform-variant terrain
- **WHEN** a stage defines brittle crystal or sticky sludge as full-platform variant data on supported platforms
- **THEN** the stage accepts that data for validation, runtime, and rendering from the same authored source

### Requirement: Terrain-variant migration remains covered by regression verification
The game SHALL keep brittle and sticky platform-variant migration verifiable through automated tests and scripted playtest coverage. Regression coverage MUST include validation checks for legacy overlay rejection, runtime checks for brittle state transitions on full-platform variants, controller checks that sticky no longer modifies jump strength, and scripted or automated stage coverage that confirms migrated authored data appears with matching runtime and rendering extents.

#### Scenario: Running automated regression coverage for migrated terrain variants
- **WHEN** automated tests run after brittle and sticky have been migrated to platform variants
- **THEN** the suite verifies brittle state behavior, sticky grounded drag behavior, and rejection of legacy overlay authoring

#### Scenario: Running scripted stage coverage for migrated terrain variants
- **WHEN** scripted playtest coverage evaluates a stage with brittle or sticky platform variants
- **THEN** the coverage confirms the migrated stage data, runtime behavior, and rendered platform footprint stay aligned