## ADDED Requirements

### Requirement: Grounded hopper starts and first hops stay on authored support
The game SHALL treat grounded hoppers as supported foot enemies from their first visible frame. A grounded hopper spawn MUST resolve to real floor or platform support, MUST NOT appear floating above its intended footing, and MUST choose its first committed hop from reachable supported landing candidates that preserve the authored encounter lane. If no reachable supported landing exists for that initial move, the hopper MUST remain on support or in another bounded grounded waiting state instead of launching into unsupported space or defaulting to an arbitrary leftward hop.

#### Scenario: Rejecting an unsupported grounded hopper start
- **WHEN** authored validation evaluates a grounded hopper spawn that does not map to real supporting floor or platform footing
- **THEN** validation fails that authoring instead of allowing the hopper to appear floating at runtime

#### Scenario: Preserving an authored opening lane
- **WHEN** a grounded hopper begins an encounter and the authored layout offers a deterministic reachable supported first landing on the intended route
- **THEN** the hopper opens by targeting that supported landing rather than defaulting to a left-biased launch

#### Scenario: No valid first landing exists
- **WHEN** a grounded hopper has no reachable supported landing candidate for its first hop
- **THEN** it remains on support or in another bounded grounded waiting state instead of jumping into unsupported space

### Requirement: Hopper authoring must prove reachable supported routing
The game SHALL validate grounded hopper authoring against reachable supported routing, not only against nearby geometry. A grounded hopper encounter MUST provide a supported starting foothold and at least one reachable supported initial landing when the authored behavior expects the hopper to advance, and invalid layouts MUST fail validation or focused regression coverage before they are accepted.

#### Scenario: Accepting a valid grounded hopper route
- **WHEN** authored validation evaluates a grounded hopper encounter whose spawn support and initial landing path are both reachable within the hopper's supported movement envelope
- **THEN** that encounter passes validation for runtime use

#### Scenario: Rejecting an unreachable first-hop encounter
- **WHEN** authored validation evaluates a grounded hopper encounter whose initial intended landing is unreachable even though nearby geometry exists
- **THEN** validation rejects the encounter as unsupported hopper routing

## MODIFIED Requirements

### Requirement: Enemy and hazard motion feedback stays readable and deterministic
The game SHALL use bounded retro animation to communicate enemy movement and telegraph state without changing encounter fairness. Repeating enemy states such as idle watch, patrol or hover motion, windup, firing telegraph, and defeat feedback MUST read through deterministic low-frame pose changes, restrained tween accents, local particles, or a bounded combination of those treatments rather than purely static rendering. For this change, grounded foot enemies means the supported grounded walker and hopper enemy kinds only. Grounded walkers MUST expose readable walking or patrol motion while advancing, grounded hoppers MUST expose distinct crouch, launch, airborne, landing-recovery, and grounded-wait states that still read as support-based foot-enemy behavior, and ovni or flyer enemies MUST keep a separate hover presentation that uses local sparkling-light accents rather than foot-enemy gait states. Enemy defeat feedback MAY emit a short local disappearing-particle burst before the enemy fully vanishes, but that presentation MUST remain subordinate to existing spacing, attack timing, projectile cadence, defeat resolution, and telegraph windows. When an enemy is defeated by a player stomp, or by a Plasma Blaster projectile hit, the supported defeat feedback MUST keep the victim visible at its last world position for a brief local hold of about 96 ms before hide or destroy cleanup so a victim-side flash or tween can read. Stomp and Plasma Blaster enemy-defeat bursts MUST remain visibly distinct, MUST remain clearly visible above ordinary gameplay objects during mixed encounters, and MUST fully resolve within a short local presentation window that does not alter encounter timing.

#### Scenario: Reading a grounded enemy before committing to an encounter
- **WHEN** the player approaches a visible grounded walker or hopper enemy on the critical path
- **THEN** its current patrol, hop-prep, airborne, grounded-wait, or recovery state is readable through bounded motion or pose change
- **AND** the player is not required to infer that state from a fully static sprite alone

#### Scenario: Reading a flyer hover state
- **WHEN** the player approaches a visible ovni or flyer enemy
- **THEN** its hover state remains readable through bounded hover motion and local sparkle accents
- **AND** it does not borrow grounded walk, grounded-wait, or hop presentation states

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