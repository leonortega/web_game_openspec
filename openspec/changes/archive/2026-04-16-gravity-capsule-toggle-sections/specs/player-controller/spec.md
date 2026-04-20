## ADDED Requirements

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply enabled gravity capsule sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without changing the underlying movement model. A dormant gravity capsule section MUST leave the player's jump, fall, dash, launcher impulse, and grounded movement behavior unchanged. An enabled gravity capsule section MUST modify only the player's ongoing airborne vertical acceleration after the relevant jump, launcher, or dash-overridden motion rule has already been determined, and normal gravity MUST resume immediately when the player leaves the enabled field bounds.

#### Scenario: Jumping through a dormant gravity capsule section
- **WHEN** the player jumps or falls through a gravity capsule section that is still dormant
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no capsule-specific acceleration applied

#### Scenario: Jumping through an enabled gravity capsule section
- **WHEN** the player jumps or falls through a gravity capsule section after its linked button has enabled it
- **THEN** the player's initial jump or launcher impulse remains unchanged
- **AND** the capsule-specific airborne acceleration applies only after that impulse has begun and only while the player remains inside the enabled field bounds

#### Scenario: Dashing through an enabled gravity capsule section
- **WHEN** the player dashes through an enabled gravity capsule section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the capsule-specific airborne acceleration resumes only after dash no longer overrides airborne movement