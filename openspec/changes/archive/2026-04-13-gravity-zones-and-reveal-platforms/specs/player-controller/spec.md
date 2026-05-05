## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. Low gravity MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, spring-launch, or dash impulse values.

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

#### Scenario: Jumping inside a low-gravity zone
- **WHEN** the player jumps or double jumps while inside an authored low-gravity zone
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining ascent and descent use the reduced vertical acceleration from that zone

#### Scenario: Dashing through a low-gravity zone
- **WHEN** the player dashes while entering, leaving, or crossing a low-gravity zone
- **THEN** the dash keeps its normal dash motion while active
- **AND** the low-gravity acceleration rule resumes only after the dash no longer overrides airborne motion

#### Scenario: Launching from a spring in a low-gravity zone
- **WHEN** a spring launches the player while the player is inside a low-gravity zone
- **THEN** the spring applies its normal launch impulse first
- **AND** the zone stretches the resulting airborne arc only after that launch begins

#### Scenario: Escaping a falling platform through low gravity
- **WHEN** the player escape-jumps from a falling platform while still inside a low-gravity zone
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** low gravity affects only the airborne arc after the jump has started