## ADDED Requirements

### Requirement: Broad helper falling-platform jump coverage matches controller truth
The project SHALL keep broad automated `Mechanic Checks` coverage for falling-platform jump behavior aligned with the current shipped controller contract. When the helper evaluates a falling-platform jump, it MUST treat top-surface contact on the falling platform as valid support for jump initiation, including escape jumps that begin while the player is still inside a gravity inversion column. The helper MUST derive its jump-input sequencing and pass criteria from the same controller truth already exercised by runtime coverage, and it MUST NOT fail solely because it still assumes an older helper-side jump timing model.

#### Scenario: Checking an escape jump from a falling platform
- **WHEN** broad automated coverage evaluates an escape jump that starts from valid falling-platform top-surface contact inside a gravity inversion column
- **THEN** it accepts the probe only if the jump initiation and post-takeoff gravity behavior match the shipped controller contract already covered by runtime tests

## MODIFIED Requirements