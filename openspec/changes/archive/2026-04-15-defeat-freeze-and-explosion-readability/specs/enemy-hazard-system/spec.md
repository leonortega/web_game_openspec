## MODIFIED Requirements

### Requirement: Enemy and hazard motion feedback stays readable and deterministic
The game SHALL use bounded retro animation to communicate enemy movement and telegraph state without changing encounter fairness. Repeating enemy states such as idle watch, patrol or hover motion, windup, firing telegraph, and defeat feedback MUST read through deterministic low-frame pose changes, restrained tween accents, local particles, or a bounded combination of those treatments rather than purely static rendering. For this change, grounded foot enemies means the supported grounded walker and hopper enemy kinds only. Grounded walkers MUST expose readable walking or patrol motion while advancing, grounded hoppers MUST expose distinct crouch, launch, airborne, and landing-recovery poses, and ovni or flyer enemies MUST keep a separate hover presentation that uses local sparkling-light accents rather than foot-enemy gait states. Enemy defeat feedback MAY emit a short local disappearing-particle burst before the enemy fully vanishes, but that presentation MUST remain subordinate to existing spacing, attack timing, projectile cadence, defeat resolution, and telegraph windows. When an enemy is defeated by a player stomp, or by a Plasma Blaster projectile hit, the supported defeat feedback MUST keep the victim visible at its last world position for a brief local hold of about 96 ms before hide or destroy cleanup so a victim-side flash or tween can read. Stomp and Plasma Blaster enemy-defeat bursts MUST remain visibly distinct, MUST remain clearly visible above ordinary gameplay objects during mixed encounters, and MUST fully resolve within a short local presentation window that does not alter encounter timing.

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

#### Scenario: Comparing stomp and projectile defeat feedback
- **WHEN** the player defeats the same supported enemy kind once by stomping and once by a Plasma Blaster projectile
- **THEN** each defeat uses a visibly distinct local particle and victim-tween treatment that remains clearly visible above ordinary gameplay objects
- **AND** both treatments remain brief enough that nearby threats stay readable

#### Scenario: Reading enemy defeat feedback in a mixed encounter
- **WHEN** an enemy is defeated while other enemies, hazards, or projectiles remain active nearby
- **THEN** the defeated enemy may emit a short local disappearing-particle burst that matches its defeat cause and stays readable above ordinary gameplay objects
- **AND** the added feedback does not obscure the routing-critical threat states that remain active

#### Scenario: Reading the defeated enemy before cleanup
- **WHEN** a supported enemy defeat triggers
- **THEN** the defeated enemy remains visible briefly at the defeat position so a local flash or tween can read before the body hides
- **AND** the short visible hold does not change defeat timing, projectile cadence, or nearby enemy behavior