## MODIFIED Requirements

### Requirement: Terrain readability cues remain covered by the verification path
The game SHALL keep regression coverage for the readability of existing brittle and sticky platform variants while also confirming that the current shipped main campaign once again contains live brittle and sticky rollout. The documented verification path for terrain-variant behavior, presentation changes, or campaign stage-authoring changes MUST include automated authored-stage coverage that confirms Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array each contain at least one live brittle or sticky platform variant and that the combined main-stage rollout includes at least one `brittleCrystal` beat and at least one `stickySludge` beat. That same verification path MUST continue to confirm that brittle and sticky variants remain visually distinguishable in play and that brittle warning and post-break presentation reset back to the intact readable baseline on retry, checkpoint respawn, or fresh attempts. This verification path MAY use targeted authored-stage tests, bounded analysis helpers, or other automated checks and MUST NOT depend on reviving legacy overlay data.

#### Scenario: Verifying readable terrain cues in current main-stage rollout
- **WHEN** automated terrain-variant coverage runs for campaign authoring or terrain presentation changes
- **THEN** it confirms Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array each contain at least one live brittle or sticky platform variant
- **AND** it confirms the combined current main-stage rollout includes both `brittleCrystal` and `stickySludge`

#### Scenario: Verifying readable live terrain cues in campaign coverage
- **WHEN** automated terrain-variant coverage exercises current shipped main-stage brittle or sticky sections
- **THEN** it confirms those variant surfaces are visually distinguishable in play rather than hidden under unchanged normal-platform presentation

#### Scenario: Verifying brittle readability after retry
- **WHEN** coverage triggers a brittle crystal warning or break and then retries from a respawn or fresh attempt
- **THEN** the brittle surface returns to its intact readable baseline presentation for that new attempt