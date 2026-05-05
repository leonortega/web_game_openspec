## MODIFIED Requirements

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without changing the underlying movement model. An enclosed gravity room section that has not yet been disabled MUST modify only the player's ongoing airborne vertical acceleration after the relevant jump, launcher, or dash-overridden motion rule has already been determined. Once the linked interior disable button has been triggered, that room section MUST leave the player's jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity MUST resume immediately when the player leaves an active room field or when that room has been disabled.

#### Scenario: Jumping through an active enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section before its linked disable button has been triggered
- **THEN** the player's initial jump or launcher impulse remains unchanged
- **AND** the room-specific airborne acceleration applies only after that impulse has begun and only while the player remains inside the active field bounds

#### Scenario: Jumping through a disabled enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no room-specific acceleration applied

#### Scenario: Dashing through an active enclosed gravity room section
- **WHEN** the player dashes through an enclosed gravity room section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the room-specific airborne acceleration resumes only after dash no longer overrides airborne movement