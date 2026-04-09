## ADDED Requirements

### Requirement: Moving platforms support stable grounded traversal
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Jumping from a moving platform
- **WHEN** the player jumps from a moving platform
- **THEN** the jump begins from a stable grounded state rather than a collision rejection state
