## ADDED Requirements

### Requirement: Unified platform surface-mechanic rollout remains covered by verification
The game SHALL keep regression coverage for platform-owned `brittleCrystal`, `stickySludge`, `bouncePod`, and `gasVent` surface mechanics while confirming that current shipped main stages use the unified static-platform authoring path. The documented verification path for platform-surface behavior, stage-authoring changes, or presentation changes MUST include automated authored-stage coverage that confirms current shipped rollout still includes live brittle or sticky beats, includes at least one platform-authored `bouncePod` beat and at least one platform-authored `gasVent` beat across at least two of Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, and encodes those four mechanics on platform-owned static-platform records rather than separate launcher collections. This verification path MAY use targeted authored-stage tests, bounded analysis helpers, or other automated checks and MUST NOT require scripted playtest coverage or manual gameplay proof.

#### Scenario: Verifying unified platform surface rollout
- **WHEN** automated stage-authoring coverage runs for platform-surface changes
- **THEN** it confirms live brittle or sticky rollout still exists in the shipped main campaign
- **AND** it confirms the current shipped rollout includes at least one platform-authored `bouncePod` beat and at least one platform-authored `gasVent` beat across at least two current main stages

#### Scenario: Verifying launcher-source retirement
- **WHEN** automated validation or authored-stage analysis audits bounce-pod and gas-vent rollout
- **THEN** it confirms shipped-stage bounce-pod and gas-vent beats come from platform-owned static-platform records rather than separate launcher collections

## MODIFIED Requirements

### Requirement: Authored launcher metadata stays valid and resets cleanly across attempts
The game SHALL validate platform-authored `bouncePod` and `gasVent` static-platform surface mechanics before runtime setup, SHALL allow spring platforms as separate full-platform traversal authoring, and SHALL treat bounce-pod and gas-vent readiness as transient traversal state. Each platform-authored `bouncePod` or `gasVent` record MUST live on a supported static platform, MUST use that platform's full top-surface footprint as its contact area, and MAY define an optional upward-biased launch direction no more than 25 degrees off vertical. Platform-authored bounce pods and gas vents MUST remain distinct from spring-platform metadata, low-gravity zones, sticky-sludge surface mechanics, and other traversal annotations used for different mechanics. A stage MUST reject separate launcher annotations, launcher collections, or other non-platform-owned bounce-pod or gas-vent source-of-truth paths for shipped-stage authoring. A platform-authored `bouncePod` or `gasVent` MUST begin ready on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that readiness from the same ready baseline instead of preserving any remaining cooldown timer. Regression coverage MUST include at least one platform-authored bounce-pod fixture, one platform-authored gas-vent fixture, one suppression-or-cooldown fixture, and one automated traversal probe that exercises bounce-pod or gas-vent composition with low gravity or sticky sludge.

#### Scenario: Loading malformed legacy launcher metadata
- **WHEN** a stage still contains a bounce-pod or gas-vent launcher annotation, launcher collection entry, invalid launch direction, or missing valid static support instead of platform-owned source data
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Loading valid platform-authored bounce or gas data
- **WHEN** a stage contains a supported static platform authored as `bouncePod` or `gasVent` with an allowed optional launch direction
- **THEN** the stage accepts that platform-owned data for simulation and rendering as a platform surface mechanic

#### Scenario: Loading valid spring platform authoring
- **WHEN** a stage contains a spring platform on a supported platform footprint without separate launcher-owned bounce-pod or gas-vent data for that beat
- **THEN** stage validation accepts that spring authoring as a separate mechanic

#### Scenario: Respawning after using a platform-authored bounce or gas surface
- **WHEN** the player fires a platform-authored `bouncePod` or `gasVent` and then dies, respawns from a checkpoint, or manually restarts the stage
- **THEN** that surface returns in its ready state instead of preserving its prior cooldown progress

#### Scenario: Running unified launch-surface regression coverage
- **WHEN** automated launch-surface regression coverage runs after bounce pods and gas vents have been migrated onto platform-owned static-platform data
- **THEN** the suite still exercises both launch-surface kinds, suppression or cooldown reuse, and at least one launch-surface route combined with low gravity or sticky sludge through focused authored test data