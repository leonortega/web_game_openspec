## ADDED Requirements

### Requirement: Platform-owned route references replace legacy terrain-surface references
The game SHALL represent brittle and sticky route dependencies through platform-centric references instead of legacy terrain-surface identifiers. Any secret route, gravity-capsule support beat, playtest fixture, or other authored route metadata that currently points at `terrainSurfaceIds` MUST migrate to platform-owned identifiers or equivalent platform-centric references in the same cleanup pass. Supported stage data and fixtures MUST NOT keep parallel platform and terrain-surface reference lists for the same route behavior.

#### Scenario: Loading route metadata with platform-owned references
- **WHEN** a secret route, gravity-capsule support beat, or scripted fixture refers to brittle or sticky authored support
- **THEN** that reference resolves through platform-owned identifiers rather than legacy terrain-surface identifiers

#### Scenario: Loading route metadata with leftover terrain-surface identifiers
- **WHEN** authored route metadata or scripted fixtures still depend on `terrainSurfaceIds` for brittle or sticky traversal
- **THEN** validation or fixture setup rejects that data until it is migrated to platform-centric references

## MODIFIED Requirements

### Requirement: Stages include terrain variation that changes pacing
The game SHALL structure stages with meaningful platform variation such as moving traversal, unstable surfaces, full-platform brittle or sticky variants, or mobility-assisted routes so progress is shaped by more than static jumps and enemy placement.

#### Scenario: Reaching a terrain-driven segment
- **WHEN** the player enters a segment built around dynamic or variant-driven platforms
- **THEN** the stage pacing shifts through traversal timing, positioning, or movement planning

#### Scenario: Recovering after a terrain challenge
- **WHEN** the player clears a high-pressure platform-variation section
- **THEN** the stage provides a readable transition or recovery beat before the next escalation

### Requirement: Terrain readability cues remain covered by the verification path
The game SHALL keep regression coverage for the readability of existing brittle and sticky platform variants. The documented verification path for platform-variation rollout changes MUST include scripted or automated coverage that exercises at least one brittle crystal section and one sticky sludge section while confirming their distinct in-stage presentation cues remain visible during traversal. That coverage MUST also confirm that brittle warning and post-break presentation resets back to the intact readable baseline on retry, checkpoint respawn, or fresh attempts.

#### Scenario: Verifying readable terrain cues in scripted coverage
- **WHEN** scripted or automated platform-variant coverage runs
- **THEN** it exercises at least one brittle crystal section and one sticky sludge section and confirms those sections are visually distinguishable in play

#### Scenario: Verifying brittle readability after retry
- **WHEN** coverage triggers a brittle crystal warning or break and then retries from a respawn or fresh attempt
- **THEN** the brittle surface returns to its intact readable baseline presentation for that new attempt

### Requirement: Authored brittle and sticky data migrates to platform variants only
The game SHALL remove authored brittle crystal and sticky sludge support from separate `terrainSurfaces` overlays, `terrainSurfaceIds` references, and related terrain-surface schema before runtime setup. Supported stage data for these terrain types MUST identify the variant on the platform itself, MUST use that one platform record as the source of truth for validation, runtime, rendering, and route references, and MUST reject legacy terrain-surface authoring for brittle or sticky content. This migration MUST include authored stage catalog data, builders, validation fixtures, runtime fixtures, and scripted playtest fixtures that currently assume terrain-surface collections or IDs.

#### Scenario: Loading legacy overlay-authored brittle or sticky terrain
- **WHEN** a stage still defines brittle crystal or sticky sludge through separate terrain-surface overlays, collections, or identifier lists
- **THEN** authored validation rejects that stage data before runtime use

#### Scenario: Loading migrated platform-variant terrain
- **WHEN** a stage defines brittle crystal or sticky sludge as full-platform variant data on supported platforms
- **THEN** the stage accepts that data for validation, runtime, rendering, and route references from the same authored platform source

### Requirement: Terrain-variant migration remains covered by regression verification
The game SHALL keep brittle and sticky platform-variant migration verifiable through automated tests and scripted playtest coverage. Regression coverage MUST include validation checks for legacy overlay or terrain-surface-reference rejection, runtime checks for brittle state transitions on full-platform variants, controller checks that sticky no longer modifies jump strength, and scripted or automated stage coverage that confirms migrated authored data appears with matching runtime and rendering extents and with platform-centric route references.

#### Scenario: Running automated regression coverage for migrated terrain variants
- **WHEN** automated tests run after brittle and sticky have been migrated to platform variants
- **THEN** the suite verifies brittle state behavior, sticky grounded drag behavior, and rejection of legacy overlay authoring or terrain-surface references

#### Scenario: Running scripted stage coverage for migrated terrain variants
- **WHEN** scripted playtest coverage evaluates a stage with brittle or sticky platform variants
- **THEN** the coverage confirms the migrated stage data, runtime behavior, rendered platform footprint, and platform-centric route references stay aligned

### Requirement: Main-stage terrain and gravity rollout stays authored and verifiable
The game SHALL author every current main stage with at least one platform-variant section and at least one gravity-field section that satisfy the platform-variation contract for that stage's route role. Validation MUST reject any current main stage that omits platform-variant authored data, omits gravity-field authored data, or places those mechanics only in unreadable dead-end space disconnected from the intended route or optional reconnecting branch. Scripted or automated playtest coverage MUST exercise at least one authored platform-variant beat and one authored gravity-field beat in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, and those checks MUST confirm the routes remain readable, completable, and reset-consistent across death, checkpoint respawn, and fresh attempts.

#### Scenario: Loading a main stage with missing rollout data
- **WHEN** a current main stage is authored without either a platform-variant section or a gravity-field section
- **THEN** validation rejects that stage before runtime use

#### Scenario: Running campaign rollout coverage
- **WHEN** scripted or automated playtest coverage runs for the current three-stage campaign
- **THEN** the suite exercises one platform-variant beat and one gravity-field beat in each main stage
- **AND** it confirms those sections remain completable after retry or respawn