## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation.

#### Scenario: Running on solid ground
- **WHEN** the player holds a movement input on stable ground
- **THEN** the character moves horizontally in that direction with predictable acceleration and deceleration

#### Scenario: Jumping from a platform edge
- **WHEN** the player presses jump shortly after walking off a platform
- **THEN** the character still performs a valid jump

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

#### Scenario: Jumping from a falling platform
- **WHEN** the player is still in contact with the top of a falling platform and presses jump
- **THEN** the controller performs a normal jump rather than dropping the player out of jumpable support early
