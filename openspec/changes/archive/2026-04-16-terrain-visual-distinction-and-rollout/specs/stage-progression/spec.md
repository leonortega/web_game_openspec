## ADDED Requirements

### Requirement: Main-stage special terrain rollout stays validated and route-relevant
The game SHALL validate broadened `brittleCrystal` and `stickySludge` rollout across the current main stages before those stages are accepted for runtime use. Validation MUST reject any current main stage that contains fewer than two authored brittle crystal surfaces, fewer than two authored sticky sludge surfaces, or places those added surfaces only in unreadable dead-end space disconnected from the intended route or an optional reconnecting branch. Automated authored-data coverage MUST assert these per-kind minimums for Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array.

#### Scenario: Rejecting a main stage with insufficient brittle rollout
- **WHEN** a current main stage is authored with fewer than two brittle crystal surfaces
- **THEN** validation rejects that stage before runtime use

#### Scenario: Rejecting a main stage with insufficient sticky rollout
- **WHEN** a current main stage is authored with fewer than two sticky sludge surfaces
- **THEN** validation rejects that stage before runtime use

#### Scenario: Running campaign terrain rollout coverage
- **WHEN** authored-data coverage runs for the current three-stage campaign
- **THEN** it asserts that each main stage satisfies the brittle and sticky per-kind rollout minimums

### Requirement: Terrain readability cues remain covered by the verification path
The game SHALL keep regression coverage for the readability of existing special terrain surfaces. The documented verification path for terrain rollout changes MUST include scripted or automated coverage that exercises at least one brittle crystal section and one sticky sludge section while confirming their distinct in-stage presentation cues remain visible during traversal. That coverage MUST also confirm that brittle warning and post-break presentation resets back to the intact readable baseline on retry, checkpoint respawn, or fresh attempts.

#### Scenario: Verifying readable terrain cues in scripted coverage
- **WHEN** scripted or automated terrain coverage runs
- **THEN** it exercises at least one brittle crystal section and one sticky sludge section and confirms those sections are visually distinguishable in play

#### Scenario: Verifying brittle readability after retry
- **WHEN** coverage triggers a brittle crystal warning or break and then retries from a respawn or fresh attempt
- **THEN** the brittle surface returns to its intact readable baseline presentation for that new attempt