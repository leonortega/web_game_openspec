## ADDED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat gravity capsule buttons and linked capsule sections as live traversal activation state rather than checkpoint-persistent route discovery. Every gravity capsule button and linked section MUST begin dormant on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild them from that dormant baseline instead of preserving prior enabled state. A checkpoint snapshot MUST NOT restore a previously enabled capsule section, even if the checkpoint was reached after the section had been activated. Authored validation MUST accept a gravity capsule section only when its linked button lies on an intended reachable approach before the gated route, the capsule contains readable traversable route geometry within its shell, and the stage remains safely completable when that section has reset to dormant.

#### Scenario: Dying after enabling a gravity capsule section
- **WHEN** the player enables a gravity capsule section and then dies before finishing the route it gates
- **THEN** the next life restores that button and capsule section to their dormant baseline until retriggered

#### Scenario: Respawning from a later checkpoint after capsule activation
- **WHEN** the player enables a gravity capsule section, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the enabled capsule state

#### Scenario: Rejecting an unreachable or uncontained gravity capsule section
- **WHEN** authored validation evaluates a gravity capsule section whose button is off the intended route or whose shell lacks a readable contained traversal line
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Accepting a retry-safe gravity capsule section
- **WHEN** authored validation evaluates a gravity capsule section with a reachable linked button, contained route geometry, and a safe dormant-state fallback or retrigger path
- **THEN** validation accepts that section as a valid bounded traversal segment