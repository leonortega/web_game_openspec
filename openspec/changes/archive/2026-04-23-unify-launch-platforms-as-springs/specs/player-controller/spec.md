## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. When the player is inside an authored anti-grav stream, the controller MUST add only upward-biased ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the stream. When the player is inside an authored gravity inversion column, the controller MUST reverse only the player's ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the column. Low gravity, anti-grav streams, and gravity inversion columns MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, spring-platform, or dash impulse values. While the player is grounded on authored sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed only. Sticky sludge MUST preserve grounded jump launch strength, jump buffering, coyote timing, spring-platform, dash, and gravity-field composition rules instead of rewriting them. Authored spring platforms MUST apply their spring boost on the first eligible top-surface contact update before low-gravity, anti-grav-stream, or gravity-inversion airborne adjustment begins. If jump input is already held, or a buffered jump resolves, on that spring-contact update, the spring platform MUST not auto-boost for that contact and the controller MUST continue with the normal grounded jump or support resolution instead. An active dash MUST NOT be interrupted by spring-platform contact, and a spring platform MUST NOT retroactively boost later during the same uninterrupted contact after dash contact or suppression. An active dash MUST suppress low-gravity, anti-grav-stream, and gravity-inversion acceleration while dash motion still overrides airborne movement.

#### Scenario: Running on solid ground
- **WHEN** the player holds a movement input on stable ground
- **THEN** the character moves horizontally in that direction with predictable acceleration and deceleration

#### Scenario: Running on sticky sludge
- **WHEN** the player holds a movement input while grounded on sticky sludge
- **THEN** the character accelerates more slowly and reaches a lower grounded top speed than on stable normal ground

#### Scenario: Jumping from a platform edge
- **WHEN** the player presses jump shortly after walking off a platform
- **THEN** the character still performs a valid jump

#### Scenario: Jumping from sticky sludge coyote time
- **WHEN** the player presses jump during coyote time immediately after leaving sticky sludge support
- **THEN** the controller performs a valid jump using the normal jump launch strength for that takeoff

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

#### Scenario: Buffering a jump onto sticky sludge
- **WHEN** a buffered jump resolves on the frame the player lands on sticky sludge
- **THEN** the character jumps immediately using the normal jump launch strength

#### Scenario: Jumping from a falling platform
- **WHEN** the player is still in contact with the top of a falling platform and presses jump
- **THEN** the controller performs a normal jump rather than dropping the player out of jumpable support early

#### Scenario: Jumping inside a low-gravity zone
- **WHEN** the player jumps or double jumps while inside an authored low-gravity zone
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining ascent and descent use the reduced vertical acceleration from that zone

#### Scenario: Jumping inside an anti-grav stream
- **WHEN** the player jumps or double jumps while inside an authored anti-grav stream
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining airborne motion gains the stream's upward-biased acceleration only after that impulse begins

#### Scenario: Crossing a gravity inversion column while airborne
- **WHEN** the player is airborne and enters an authored gravity inversion column
- **THEN** the controller reverses only the ongoing airborne vertical acceleration while the player remains inside the column
- **AND** normal gravity resumes immediately after the player exits the column

#### Scenario: Jumping from sticky sludge inside an anti-grav stream
- **WHEN** the player initiates a grounded jump from sticky sludge while inside an authored anti-grav stream
- **THEN** the jump starts with the normal impulse
- **AND** the remaining airborne motion gains the stream's upward-biased acceleration only after that jump has started

#### Scenario: Dashing through an authored gravity field
- **WHEN** the player dashes while entering, leaving, or crossing a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the dash keeps its normal dash motion while active
- **AND** the field-specific airborne acceleration rule resumes only after the dash no longer overrides airborne motion

#### Scenario: Dashing through sticky sludge
- **WHEN** the player dashes while entering, leaving, or crossing sticky sludge
- **THEN** the dash keeps its normal dash motion while active
- **AND** any sticky-sludge grounded penalties resume only after the dash no longer overrides movement and the player is grounded on sludge again

#### Scenario: Launching from a spring platform in an authored gravity field
- **WHEN** a spring platform boosts the player while the player is inside a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the spring platform applies its authored boost first
- **AND** the field changes the resulting airborne arc only after that launch begins

#### Scenario: Launching from a spring platform on sticky sludge
- **WHEN** a spring platform boosts the player from sticky sludge support
- **THEN** the spring platform applies its normal authored boost rather than a sludge-reduced jump impulse

#### Scenario: Suppressing a spring boost by holding jump
- **WHEN** the player first contacts an authored spring platform while jump is already held
- **THEN** the spring platform does not auto-boost on that contact
- **AND** the player keeps normal grounded jump and support behavior for that landing

#### Scenario: Resolving a buffered jump on a spring platform
- **WHEN** a buffered jump resolves on the frame the player first lands on an authored spring platform
- **THEN** the buffered jump takes priority for that contact
- **AND** the spring platform does not auto-boost until a later eligible new contact

#### Scenario: Dashing onto a spring platform
- **WHEN** the player contacts an authored spring platform while dash still overrides movement
- **THEN** the dash continues without interruption
- **AND** the spring platform does not boost later unless the player creates a new eligible contact after dash no longer overrides motion

#### Scenario: Escaping a falling platform through a gravity inversion column
- **WHEN** the player escape-jumps from a falling platform while still inside a gravity inversion column
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** the gravity inversion affects only the airborne arc after the jump has started