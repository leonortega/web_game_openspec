## MODIFIED Requirements

### Requirement: Unified platform surface-mechanic rollout remains covered by verification
The game SHALL keep regression coverage for platform-owned `brittleCrystal` and `stickySludge` surface mechanics while confirming that current shipped main stages use spring platforms as the only launch-platform family. The documented verification path for platform-surface behavior, stage-authoring changes, or presentation changes MUST include automated authored-stage coverage that confirms current shipped rollout still includes live brittle or sticky beats, includes live spring-platform beats across the current main campaign, and no longer encodes `bouncePod`, `gasVent`, launcher annotations, or unchanged plain-static stand-ins where converted launch beats are expected. This verification path MAY use targeted authored-stage tests, bounded analysis helpers, or other automated checks and MUST NOT require scripted playtest coverage or manual gameplay proof.

#### Scenario: Verifying terrain and spring rollout
- **WHEN** automated stage-authoring coverage runs for platform-surface or launch-platform changes
- **THEN** it confirms live brittle or sticky rollout still exists in the shipped main campaign
- **AND** it confirms the current shipped rollout includes live spring-platform beats across current main stages

#### Scenario: Verifying bounce and gas retirement
- **WHEN** automated validation or authored-stage analysis audits converted launch-platform beats
- **THEN** it confirms shipped-stage data no longer uses `bouncePod`, `gasVent`, or launcher annotations
- **AND** it confirms those beats are not implemented as unchanged plain support or token spring overlays

## ADDED Requirements

### Requirement: Spring-platform authoring stays valid and false-positive-free
The game SHALL validate spring-platform authoring as full-footprint traversal support and SHALL reject retired bounce-pod and gas-vent authoring before runtime setup. Stage validation MUST reject stage data that still encodes `bouncePod`, `gasVent`, legacy launcher annotations, or spring-only sub-footprints layered over unchanged normal support for a beat intended as launch-platform traversal. Spring-platform authoring MUST remain distinct from brittle-crystal and sticky-sludge surface annotations, low-gravity zones, and other traversal annotations used for different mechanics. Death, checkpoint respawn, and manual stage restart MUST rebuild spring behavior solely from authored platform data and normal scene state rather than from launcher-style readiness or cooldown state.

#### Scenario: Loading retired launcher authoring
- **WHEN** a stage contains `bouncePod`, `gasVent`, or launcher annotation data
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Rejecting a token spring overlay conversion
- **WHEN** a stage attempts to replace a former launch beat with a tiny spring strip or equivalent spring-only patch on otherwise unchanged normal support
- **THEN** validation rejects that authored data until the beat is expressed as a full-footprint spring platform or another supported variation beat

#### Scenario: Loading valid spring-platform authoring
- **WHEN** a stage replaces a former `bouncePod` or `gasVent` beat with a full-footprint spring platform that uses readable authored support geometry
- **THEN** stage validation accepts that spring authoring without requiring launcher metadata for the same beat

#### Scenario: Respawning after using a spring platform
- **WHEN** the player uses a spring platform and then dies, respawns from a checkpoint, or manually restarts the stage
- **THEN** the spring platform behaves from its normal authored baseline with no preserved launcher-style readiness or cooldown state

## REMOVED Requirements

### Requirement: Authored launcher metadata stays valid and resets cleanly across attempts
**Reason**: Launcher-specific authoring and readiness state are retired with `bouncePod` and `gasVent`.
**Migration**: Replace launcher annotations and launcher-state fixtures with full-footprint spring-platform authoring plus automated coverage that proves bounce/gas references are gone and converted beats stay readable.