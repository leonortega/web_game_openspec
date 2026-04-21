## MODIFIED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its bottom entry and bottom exit openings lie on intended reachable route segments, each door opening has explicit usable stable footing on the authored route for approach and continued traversal, its interior disable button is reachable after entering the room while the field is still active, its shell fully contains the linked field and all authored room-local content, and no authored enemy, moving platform, or other traversal content path intrudes through sealed shell wall bands outside the authored door openings. The intended room route MUST remain reachable and not cut off in authored play space.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Respawning from a later checkpoint after room disable
- **WHEN** the player disables an enclosed gravity room, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the disabled room state

#### Scenario: Rejecting an enclosed gravity room door without usable footing
- **WHEN** authored validation evaluates an enclosed gravity room whose bottom entry or exit opening lacks explicit usable stable footing on its intended route
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting shell-band intrusion
- **WHEN** authored validation evaluates an enclosed gravity room whose enemy, moving-platform, or other traversal-content path crosses a sealed shell wall band outside the authored door openings
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Accepting a contained enclosed gravity room
- **WHEN** authored validation evaluates an enclosed gravity room with separate bottom entry and exit openings, explicit usable footing at both doors, a reachable interior disable button, and fully contained reachable room content
- **THEN** validation accepts that section as a valid bounded traversal segment