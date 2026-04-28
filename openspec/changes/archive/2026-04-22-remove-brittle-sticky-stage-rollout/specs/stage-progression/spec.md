## MODIFIED Requirements

### Requirement: Terrain readability cues remain covered by the verification path
The game SHALL keep regression coverage for the readability of existing brittle and sticky platform variants without requiring the current main campaign stages to contain live brittle or sticky sections. The documented verification path for terrain-variant behavior or presentation changes MUST include scripted or automated coverage that exercises at least one brittle crystal variant and one sticky sludge variant in a bounded fixture, targeted sample stage, or other non-campaign authored test surface while confirming their distinct presentation cues remain visible during traversal. That coverage MUST also confirm that brittle warning and post-break presentation resets back to the intact readable baseline on retry, checkpoint respawn, or fresh attempts.

#### Scenario: Verifying readable terrain cues in targeted coverage
- **WHEN** scripted or automated terrain-variant coverage runs
- **THEN** it exercises at least one brittle crystal variant and one sticky sludge variant outside the current main campaign stages
- **AND** it confirms those variant surfaces are visually distinguishable in play

#### Scenario: Verifying brittle readability after retry
- **WHEN** coverage triggers a brittle crystal warning or break and then retries from a respawn or fresh attempt
- **THEN** the brittle surface returns to its intact readable baseline presentation for that new attempt

## REMOVED Requirements

### Requirement: Main-stage special terrain rollout stays validated and route-relevant
**Reason**: The current main-stage campaign no longer requires brittle/sticky rollout minimums for stage acceptance.
**Migration**: Remove campaign terrain-quota checks and replace them with normal-platform authoring for those routes while keeping targeted brittle/sticky regression coverage outside the current main campaign.