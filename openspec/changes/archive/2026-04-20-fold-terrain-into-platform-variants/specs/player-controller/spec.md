## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. When the player is inside an authored anti-grav stream, the controller MUST add only upward-biased ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the stream. When the player is inside an authored gravity inversion column, the controller MUST reverse only the player's ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the column. Low gravity, anti-grav streams, and gravity inversion columns MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, spring-launch, biome-launcher, or dash impulse values. While the player is grounded on authored sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed only. Sticky sludge MUST preserve grounded jump launch strength, jump buffering, coyote timing, spring-launch, biome-launcher, dash, and gravity-field composition rules instead of rewriting them.

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

#### Scenario: Launching from a spring in an authored gravity field
- **WHEN** a spring launches the player while the player is inside a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the spring applies its normal launch impulse first
- **AND** the field changes the resulting airborne arc only after that launch begins

#### Scenario: Launching from a spring on sticky sludge
- **WHEN** a spring launches the player from sticky sludge support
- **THEN** the spring applies its normal launch impulse rather than a sticky-modified jump impulse

#### Scenario: Launching from a biome launcher on sticky sludge
- **WHEN** a bounce pod or gas vent launches the player from sticky sludge support
- **THEN** the launcher applies its normal authored launch impulse rather than a sticky-modified jump impulse

#### Scenario: Escaping a falling platform through a gravity inversion column
- **WHEN** the player escape-jumps from a falling platform while still inside a gravity inversion column
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** the gravity inversion affects only the airborne arc after the jump has started