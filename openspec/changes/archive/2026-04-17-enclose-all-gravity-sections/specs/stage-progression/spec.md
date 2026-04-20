## MODIFIED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its bottom entry and bottom exit openings lie on intended reachable route segments, its interior disable button is reachable after entering the room while the field is still active, its shell fully contains the linked field and all authored room-local content, and the intended room route remains reachable and not cut off in authored play space. For the current playable stages, authored validation MUST also reject any anti-grav stream or gravity inversion column that is not bound to an enclosed gravity room section.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Respawning from a later checkpoint after room disable
- **WHEN** the player disables an enclosed gravity room, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the disabled room state

#### Scenario: Rejecting an unreachable or cut-off enclosed gravity room
- **WHEN** authored validation evaluates an enclosed gravity room whose interior disable button is unreachable, whose bottom entry or exit opening is not on the intended route, or whose shell cuts off linked room content or route geometry
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an open gravity section in a current playable stage
- **WHEN** authored validation evaluates Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array and finds an anti-grav stream or gravity inversion column outside an enclosed gravity room
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Accepting a contained enclosed gravity room
- **WHEN** authored validation evaluates an enclosed gravity room with separate bottom entry and exit openings, a reachable interior disable button, fully contained reachable room content, and a field bound to that room
- **THEN** validation accepts that section as a valid bounded traversal segment