## MODIFIED Requirements

### Requirement: Terrain-variant migration remains covered by regression verification
The game SHALL keep brittle and sticky platform-variant migration verifiable through automated tests and scripted playtest coverage without relying on the current main campaign stages to supply live brittle or sticky routes. Regression coverage MUST include validation checks for legacy overlay or terrain-surface-reference rejection, runtime checks for brittle state transitions on full-platform variants, controller checks that sticky no longer modifies jump strength, and scripted or automated stage coverage that confirms migrated authored data appears with matching runtime and rendering extents and with platform-centric route references. The same verification path MUST also confirm that current main-stage green-top routes in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array no longer author `brittleCrystal` or `stickySludge` as hidden terrain behavior under plain normal-platform presentation.

#### Scenario: Running automated regression coverage for migrated terrain variants
- **WHEN** automated tests run after brittle and sticky have been migrated to platform variants
- **THEN** the suite verifies brittle state behavior, sticky grounded drag behavior, and rejection of legacy overlay authoring or terrain-surface references

#### Scenario: Running scripted stage coverage for migrated terrain variants
- **WHEN** scripted playtest coverage evaluates a stage with brittle or sticky platform variants
- **THEN** the coverage confirms the migrated stage data, runtime behavior, rendered platform footprint, and platform-centric route references stay aligned

#### Scenario: Auditing current main-stage green routes
- **WHEN** validation or scripted campaign coverage evaluates Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array
- **THEN** plain green-top route platforms in those stages are not authored with `brittleCrystal` or `stickySludge`
- **AND** those stages do not preserve hidden terrain-mechanic behavior under unchanged normal-platform visuals