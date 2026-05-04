## MODIFIED Requirements

### Requirement: Moving platforms support stable grounded traversal
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal. Same-frame rider carry on moving platforms MUST use the platform's realized frame displacement (current frame position minus recorded previous frame position), not a velocity-derived estimate. If a moving platform's authored motion ends that top-surface support contact by clearing out from under the player's occupied footprint, the player MUST begin falling from the same occupied position on that detach update, and that former support MUST NOT immediately resolve as a same-frame horizontal wall for that update alone. Prior-support reconstruction used by same-frame detach evaluation MUST use that platform's recorded previous-frame position rather than reconstructing from current velocity.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Bounce or clamp movement frame
- **WHEN** a moving platform's movement is clamped or bounced by containment on a frame
- **THEN** rider carry uses that frame's realized platform displacement after containment
- **AND** rider movement does not use stale or zeroed velocity values from that frame

#### Scenario: Falling platform with changing vertical velocity
- **WHEN** a falling platform's vertical velocity changes during the frame
- **THEN** rider carry follows the realized platform displacement for that frame
- **AND** does not depend on a stale pre-change vertical velocity sample

#### Scenario: Falling when a moving platform clears away
- **WHEN** a moving platform's motion ends valid top-surface support by moving away from under the player's occupied footprint
- **THEN** the player begins falling from the position they occupied on that platform
- **AND** prior-support reconstruction for that detach evaluation uses the platform's recorded previous-frame position
- **AND** the former support does not shove the player sideways as a same-frame horizontal blocker on that detach update
