## MODIFIED Requirements

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one bottom entry door opening, one separate bottom exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST still affect only the player and only airborne vertical acceleration inside its authored bounds.

#### Scenario: Entering an active anti-grav room section
- **WHEN** the player becomes airborne inside an enclosed gravity room section whose linked field is an active anti-grav stream
- **THEN** the room applies the normal anti-grav airborne acceleration only while the player remains inside the authored field bounds

#### Scenario: Entering an active gravity inversion room section
- **WHEN** the player becomes airborne inside an enclosed gravity room section whose linked field is an active gravity inversion column
- **THEN** the room reverses the player's ongoing airborne vertical acceleration only while the player remains inside the authored field bounds

#### Scenario: Disabling an enclosed gravity room section
- **WHEN** the player first gains eligible contact with an enclosed gravity room section's linked interior disable button
- **THEN** that room section disables its linked gravity field on the same update
- **AND** the field remains disabled until a reset event occurs

#### Scenario: Passing through a disabled gravity room section
- **WHEN** the player enters the authored bounds of an enclosed gravity room section after its linked interior button has been triggered
- **THEN** that section does not apply anti-grav or gravity-inversion acceleration

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one bottom entry opening and one separate bottom exit opening; MUST fully contain its linked gravity field, platforms, enemies, hazards, pickups, disable button, and other authored room-local content; MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state; and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its platforms, enemies, button, and traversal routes fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path

## ADDED Requirements

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages.

#### Scenario: Loading Verdant Impact Crater
- **WHEN** Verdant Impact Crater is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Ember Rift Warrens
- **WHEN** Ember Rift Warrens is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Halo Spire Array
- **WHEN** Halo Spire Array is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Comparing room rollout across stages
- **WHEN** the player compares current playable stages with enclosed gravity sections
- **THEN** each stage uses the full enclosed-room rollout with its own authored room geometry and route shape rather than leaving legacy open-field exceptions behind