## MODIFIED Requirements

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without broadening into a global movement rewrite. An enclosed gravity room section that has not yet been disabled MUST continue applying its room-specific airborne acceleration anywhere inside the room's interior play volume. While that room field is still active, player jump initiation from valid support inside that room MUST use a room-scoped inverse takeoff instead of the normal upward takeoff. Buffered jump resolution and coyote-time jump resolution sourced from that same active room support MUST follow the same inverse takeoff rule. Double jump, launcher, spring, and dash initiation rules MUST otherwise remain unchanged, and the room-specific airborne acceleration MUST continue after the inverse takeoff has begun. Once the linked interior disable button has been triggered, that room section MUST leave the player's grounded jump, buffered jump, coyote jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity and normal jump semantics MUST resume immediately when the player leaves an active room interior or when that room has been disabled. Enemies inside or outside enclosed gravity rooms MUST keep their normal enemy movement and gravity behavior regardless of the room field state. This controller contract MUST apply consistently across every current playable stage's enclosed gravity room rollout, including rooms that replace formerly open anti-grav and inversion sections.

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