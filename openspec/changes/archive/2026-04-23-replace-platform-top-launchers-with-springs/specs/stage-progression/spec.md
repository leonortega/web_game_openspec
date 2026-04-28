## MODIFIED Requirements

### Requirement: Authored launcher metadata stays valid and resets cleanly across attempts
The game SHALL validate authored bounce pod and gas vent launcher metadata before runtime setup, SHALL allow spring platforms as separate full-platform traversal authoring, and SHALL treat launcher readiness as transient traversal state. Each launcher annotation MUST use a supported launcher kind, MUST define a positive bounded top-contact footprint aligned to existing solid walkable support, and MAY define an optional upward-biased launch direction no more than 25 degrees off vertical. Launcher annotations MUST remain distinct from spring-platform metadata, low-gravity zones, sticky-sludge surface annotations, and other traversal annotations used for different mechanics. A launcher annotation MUST NOT overlap another launcher footprint in a way that makes first-contact launch behavior ambiguous. Deprecated spring-launcher metadata encoded inside launcher annotations MUST be rejected. Every launcher MUST begin ready on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild launcher readiness from that ready baseline instead of preserving any remaining cooldown timer. Regression coverage MUST include at least one bounce-pod fixture, one gas-vent fixture, one suppression-or-cooldown fixture, and one automated traversal probe that exercises launcher composition with low gravity or sticky sludge even when current shipped catalog stages contain no launcher annotations.

#### Scenario: Loading malformed launcher metadata
- **WHEN** a stage contains a launcher annotation with an unknown kind, a deprecated spring-launcher kind, an invalid footprint, an unsupported direction, or missing valid support
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Rejecting ambiguous launcher overlap
- **WHEN** a stage authors a bounce pod or gas vent so its trigger footprint overlaps another launcher footprint
- **THEN** validation rejects the layout until the first-contact launch area is unambiguous

#### Scenario: Loading valid launcher metadata
- **WHEN** a stage contains valid bounce pod or gas vent annotations with aligned support and an allowed optional direction
- **THEN** the stage accepts those annotations for simulation and rendering as launcher-specific authored content

#### Scenario: Loading valid spring platform authoring
- **WHEN** a stage replaces a former support-platform launcher beat with a spring platform that uses the full support footprint
- **THEN** stage validation accepts that spring authoring without requiring launcher metadata for the same beat

#### Scenario: Respawning after using a launcher
- **WHEN** the player fires a launcher and then dies, respawns from a checkpoint, or manually restarts the stage
- **THEN** that launcher returns in its ready state instead of preserving its prior cooldown progress

#### Scenario: Running launcher regression coverage without shipped launchers
- **WHEN** automated launcher regression coverage runs after current shipped catalog support-platform launch beats have been converted to springs
- **THEN** the suite still exercises both launcher kinds, suppression or cooldown reuse, and at least one launcher route combined with low gravity or sticky sludge through dedicated fixtures or focused authored test data