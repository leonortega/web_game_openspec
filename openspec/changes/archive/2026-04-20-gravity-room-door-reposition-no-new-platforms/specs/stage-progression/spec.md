## MODIFIED Requirements

### Requirement: Gravity capsule activation resets on retry and stays authorably reachable
The game SHALL treat enclosed gravity room disable buttons and linked room sections as live traversal activation state rather than checkpoint-persistent route discovery. Every enclosed gravity room MUST begin with its linked field active on a fresh attempt, and death, checkpoint respawn, or manual stage restart MUST rebuild that room from the same active baseline instead of preserving prior disabled state. A checkpoint snapshot MUST NOT restore a previously disabled enclosed gravity room, even if the checkpoint was reached after the room had been disabled. Authored validation MUST accept an enclosed gravity room only when its bottom entry and bottom exit openings lie on intended reachable route segments, the bottom entry opening has a reachable exterior-side approach path on the authored route, the bottom exit opening has both a reachable interior-side route through the room and a usable exterior-side reconnect after the player leaves the room, its interior disable button is reachable after entering the room while the field is still active, its shell fully contains the linked field and all authored room-local content, and no authored enemy, moving platform, or other traversal content path intrudes through sealed shell wall bands outside the authored door openings. For the current playable gravity-room rollout, authored validation and authored data updates MUST satisfy those entry and exit door checks by reusing existing intended route supports, whether fixed or moving, rather than relying on a dedicated extra support platform added solely for door-side compliance. The intended room route MUST remain reachable and not cut off in authored play space.

#### Scenario: Dying after disabling an enclosed gravity room
- **WHEN** the player disables an enclosed gravity room and then dies before finishing the route it gates
- **THEN** the next life restores that room to its active baseline until the interior button is triggered again

#### Scenario: Respawning from a later checkpoint after room disable
- **WHEN** the player disables an enclosed gravity room, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the disabled room state

#### Scenario: Rejecting an enclosed gravity room entry door without correct-side approach
- **WHEN** authored validation evaluates an enclosed gravity room whose bottom entry opening lacks a reachable exterior-side approach path on its intended route
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting an enclosed gravity room exit door without correct-side reconnect
- **WHEN** authored validation evaluates an enclosed gravity room whose bottom exit opening lacks a reachable interior-side route or a usable exterior-side reconnect after leaving the room
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting shell-band intrusion
- **WHEN** authored validation evaluates an enclosed gravity room whose enemy, moving-platform, or other traversal-content path crosses a sealed shell wall band outside the authored door openings
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Rejecting doorway support that depends on a dedicated helper platform
- **WHEN** authored validation evaluates a current playable enclosed gravity room whose entry-side or exit-side doorway support exists only because of a dedicated extra platform added solely to satisfy door-side rules
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Accepting a contained enclosed gravity room
- **WHEN** authored validation evaluates an enclosed gravity room with separate bottom entry and exit openings, correct-side door access, a reachable interior disable button, and fully contained reachable room content
- **THEN** validation accepts that section as a valid bounded traversal segment