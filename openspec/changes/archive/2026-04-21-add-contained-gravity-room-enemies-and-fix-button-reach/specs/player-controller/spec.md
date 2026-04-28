## MODIFIED Requirements

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without changing the underlying movement model. An enclosed gravity room section that has not yet been disabled MUST modify only the player's ongoing airborne vertical acceleration after the relevant jump, launcher, or dash-overridden motion rule has already been determined, and it MUST apply that room-specific airborne acceleration anywhere inside the room's interior play volume rather than only inside a smaller inner field rectangle. While that room field is still active, the player MUST still be able to leave support with the normal jump, double-jump, launcher, or dash initiation rules and follow the authored room route to gain eligible contact with the linked interior disable button without requiring a new input, a jump-triggered gravity toggle, or a special-case impulse rewrite. An enclosed gravity room MUST NOT turn the player's takeoff from valid support into an immediate opposite-direction launch that makes the intended button route read backwards or unreachable. Once the linked interior disable button has been triggered, that room section MUST leave the player's jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity MUST resume immediately when the player leaves an active room interior or when that room has been disabled. Enemies inside or outside enclosed gravity rooms MUST keep their normal enemy movement and gravity behavior regardless of the room field state. This controller contract MUST apply consistently across every current playable stage's enclosed gravity room rollout, including rooms that replace formerly open anti-grav and inversion sections.

#### Scenario: Jumping through an active enclosed gravity room section
- **WHEN** the player jumps or falls anywhere through an enclosed gravity room section before its linked disable button has been triggered
- **THEN** the player's initial jump or launcher impulse remains unchanged
- **AND** the room-specific airborne acceleration applies only after that impulse has begun and only while the player remains inside the room interior

#### Scenario: Reaching the disable button while room gravity is active
- **WHEN** the player follows the intended route inside an active enclosed gravity room toward its linked interior disable button
- **THEN** the player can still use the existing jump and contact rules to gain eligible button contact before the room is disabled
- **AND** the room does not require a new interact input, jump-triggered gravity shutdown, or compliance-only support piece for that reach

#### Scenario: Reading jump takeoff inside an active enclosed gravity room
- **WHEN** the player initiates a jump from valid support inside an active enclosed gravity room
- **THEN** the jump begins with the normal takeoff impulse from that support
- **AND** any room-specific anti-grav or inversion effect bends the airborne arc only after takeoff rather than replacing the jump with an immediate opposite-direction shove from support

#### Scenario: Jumping through a disabled enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no room-specific acceleration applied anywhere in that room interior

#### Scenario: Enemy motion inside an enclosed gravity room
- **WHEN** an enemy moves or becomes airborne inside an enclosed gravity room while the room field is active or disabled
- **THEN** that enemy keeps its normal enemy gravity and movement behavior
- **AND** the room-specific gravity rule still applies only to the player

#### Scenario: Dashing through an active enclosed gravity room section
- **WHEN** the player dashes through an enclosed gravity room section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the room-specific airborne acceleration resumes only after dash no longer overrides airborne movement