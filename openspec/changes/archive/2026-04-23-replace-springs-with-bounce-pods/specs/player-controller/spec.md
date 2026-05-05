## MODIFIED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. When the player is inside an authored anti-grav stream, the controller MUST add only upward-biased ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the stream. When the player is inside an authored gravity inversion column, the controller MUST reverse only the player's ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the column. Low gravity, anti-grav streams, and gravity inversion columns MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, launcher, or dash impulse values. While the player is grounded on authored sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed only. Sticky sludge MUST preserve grounded jump launch strength, jump buffering, coyote timing, launcher, dash, and gravity-field composition rules instead of rewriting them. Authored bounce pods and gas vents MUST trigger only on the first eligible ready-contact update and MUST apply their launch impulse on that update before low-gravity, anti-grav-stream, or gravity-inversion airborne adjustment begins. If jump input is already held, or a buffered jump resolves, on that launcher-contact update, the launcher MUST not auto-launch for that contact and the controller MUST continue with the normal grounded jump or support resolution instead. An active dash MUST NOT be interrupted by launcher contact, and a launcher MUST NOT retroactively fire later during the same uninterrupted contact after dash contact or suppression. An active dash MUST suppress low-gravity, anti-grav-stream, and gravity-inversion acceleration while dash motion still overrides airborne movement.

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

#### Scenario: Launching from a bounce pod or gas vent in an authored gravity field
- **WHEN** a bounce pod or gas vent launches the player while the player is inside a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the launcher applies its authored launch impulse first
- **AND** the field changes the resulting airborne arc only after that launch begins

#### Scenario: Launching from a bounce pod or gas vent on sticky sludge
- **WHEN** a bounce pod or gas vent launches the player from sticky sludge support
- **THEN** the launcher applies its normal authored launch impulse rather than a sludge-reduced jump impulse

#### Scenario: Suppressing a launcher by holding jump
- **WHEN** the player first contacts a ready bounce pod or gas vent while jump is already held
- **THEN** the launcher does not auto-launch on that contact
- **AND** the player keeps normal grounded jump and support behavior for that landing

#### Scenario: Resolving a buffered jump on a launcher
- **WHEN** a buffered jump resolves on the frame the player first lands on a ready bounce pod or gas vent
- **THEN** the buffered jump takes priority for that contact
- **AND** the launcher does not auto-launch until a later eligible new contact

#### Scenario: Dashing onto a ready launcher
- **WHEN** the player contacts a ready bounce pod or gas vent while dash still overrides movement
- **THEN** the dash continues without interruption
- **AND** the launcher does not fire later unless the player creates a new eligible contact after dash no longer overrides motion

#### Scenario: Escaping a falling platform through a gravity inversion column
- **WHEN** the player escape-jumps from a falling platform while still inside a gravity inversion column
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** the inversion affects only the airborne arc after the jump has started

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without broadening into a global movement rewrite. An enclosed gravity room section that has not yet been disabled MUST continue applying its room-specific airborne acceleration anywhere inside the room's interior play volume. While that room field is still active, player jump initiation from valid support inside that room MUST use a room-scoped inverse takeoff instead of the normal upward takeoff. Buffered jump resolution and coyote-time jump resolution sourced from that same active room support MUST follow the same inverse takeoff rule. Double jump, launcher, and dash initiation rules MUST otherwise remain unchanged, and the room-specific airborne acceleration MUST continue after the inverse takeoff has begun. Once the linked interior disable button has been triggered, that room section MUST leave the player's grounded jump, buffered jump, coyote jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity and normal jump semantics MUST resume immediately when the player leaves an active room interior or when that room has been disabled. Enemies inside or outside enclosed gravity rooms MUST keep their normal enemy movement and gravity behavior regardless of the room field state. This controller contract MUST apply consistently across every current playable stage's enclosed gravity room rollout, including rooms that replace formerly open anti-grav and inversion sections.

#### Scenario: Jumping through an active enclosed gravity room section
- **WHEN** the player initiates a grounded, buffered, or coyote-time jump from valid support inside an enclosed gravity room before its linked disable button has been triggered
- **THEN** the jump begins with the room-scoped inverse takeoff instead of the normal upward takeoff
- **AND** the room-specific airborne acceleration applies only after that takeoff has begun and only while the player remains inside the room interior

#### Scenario: Reaching the disable button while room gravity is active
- **WHEN** the player follows the intended route inside an active enclosed gravity room toward its linked interior disable button
- **THEN** the player can still use the room's inverse jump semantics and existing contact rules to gain eligible button contact before the room is disabled
- **AND** the room does not require a new interact input, jump-triggered gravity shutdown, or compliance-only support piece for that reach

#### Scenario: Reading jump takeoff inside an active enclosed gravity room
- **WHEN** the player initiates a jump from valid support inside an active enclosed gravity room
- **THEN** the jump begins with a readable inverse takeoff from that support rather than the normal upward jump
- **AND** the room's linked anti-grav or inversion effect continues bending the airborne arc after takeoff instead of replacing the room jump rule itself

#### Scenario: Jumping through a disabled enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no room-specific acceleration applied anywhere in that room interior
- **AND** supported jump initiation inside that disabled room uses the normal upward takeoff again

#### Scenario: Enemy motion inside an enclosed gravity room
- **WHEN** an enemy moves or becomes airborne inside an enclosed gravity room while the room field is active or disabled
- **THEN** that enemy keeps its normal enemy gravity and movement behavior
- **AND** the room-specific gravity rule still applies only to the player

#### Scenario: Dashing through an active enclosed gravity room section
- **WHEN** the player dashes through an enclosed gravity room section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the room-specific airborne acceleration resumes only after dash no longer overrides airborne movement