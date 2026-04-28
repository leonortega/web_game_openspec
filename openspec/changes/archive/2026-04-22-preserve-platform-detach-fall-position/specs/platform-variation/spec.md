## MODIFIED Requirements

### Requirement: Moving platforms support stable grounded traversal
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal. If a moving platform's authored motion ends that top-surface support contact by clearing out from under the player's occupied footprint, the player MUST begin falling from the same occupied position on that detach update, and that former support MUST NOT immediately resolve as a same-frame horizontal wall for that update alone.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Jumping from a moving platform
- **WHEN** the player jumps from a moving platform
- **THEN** the jump begins from a stable grounded state rather than a collision rejection state

#### Scenario: Falling when a moving platform clears away
- **WHEN** a moving platform's motion ends valid top-surface support by moving away from under the player's occupied footprint
- **THEN** the player begins falling from the position they occupied on that platform
- **AND** the former support does not shove the player sideways as a same-frame horizontal blocker on that detach update