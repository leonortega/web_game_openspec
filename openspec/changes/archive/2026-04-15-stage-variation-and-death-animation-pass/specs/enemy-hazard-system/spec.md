## MODIFIED Requirements

### Requirement: Enemy and hazard motion feedback stays readable and deterministic
The game SHALL use bounded retro animation to communicate enemy movement and telegraph state without changing encounter fairness. Repeating enemy states such as idle watch, patrol or hover motion, windup, firing telegraph, and defeat feedback MUST read through deterministic low-frame pose changes, restrained tween accents, local particles, or a bounded combination of those treatments rather than purely static rendering. For this change, grounded foot enemies means the supported grounded walker and hopper enemy kinds only. Grounded walkers MUST expose readable walking or patrol motion while advancing, grounded hoppers MUST expose distinct crouch, launch, airborne, and landing-recovery poses, and ovni or flyer enemies MUST keep a separate hover presentation that uses local sparkling-light accents rather than foot-enemy gait states. Enemy defeat feedback MAY emit a short local dissolve or disappearing-particle burst before the enemy fully vanishes, but that presentation MUST remain subordinate to existing spacing, attack timing, projectile cadence, defeat resolution, and telegraph windows.

#### Scenario: Reading a grounded enemy before committing to an encounter
- **WHEN** the player approaches a visible grounded walker or hopper enemy on the critical path
- **THEN** its current patrol, hop-prep, airborne, or recovery state is readable through bounded motion or pose change
- **AND** the player is not required to infer that state from a fully static sprite alone

#### Scenario: Reading a flyer hover state
- **WHEN** the player approaches a visible ovni or flyer enemy
- **THEN** its hover state remains readable through bounded hover motion and local sparkle accents
- **AND** it does not borrow grounded walk or hop presentation states

#### Scenario: Preserving telegraph fairness under animation
- **WHEN** an enemy or hazard enters a windup or firing telegraph state
- **THEN** the animation reinforces the existing dangerous state without shifting the underlying timing window
- **AND** retries preserve the same authored cadence and readable response window

#### Scenario: Reading enemy defeat feedback in a mixed encounter
- **WHEN** an enemy is defeated while other enemies, hazards, or projectiles remain active nearby
- **THEN** the defeated enemy may emit a short local disappearing-particle burst
- **AND** the added feedback does not obscure the routing-critical threat states that remain active