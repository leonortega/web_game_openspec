## MODIFIED Requirements

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one bottom entry door opening, one separate bottom exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST still affect only the player and only airborne vertical acceleration inside its authored bounds. The intended read of each enclosed gravity room MUST stay centered on that one gravity field plus one disable-button route, and the room MUST NOT depend on additional interior launcher, route-toggle, or unrelated traversal gimmicks to communicate its primary challenge.

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

#### Scenario: Reading a gravity-focused room challenge
- **WHEN** the player approaches or enters an enclosed gravity room section on the intended route
- **THEN** the room reads primarily as a gravity-field traversal plus disable-button challenge
- **AND** it does not require an unrelated interior mechanic stack to understand the route

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one bottom entry opening and one separate bottom exit opening, and shell space outside those two authored openings MUST behave as blocking room walls rather than presentation-only outline. Each section MUST fully contain its linked gravity field, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. Room-local content inside an enclosed gravity room MUST stay limited to content needed to support the gravity traversal, button access, or exit reachability, and current playable rooms MUST remove non-essential pickups, hazards, enemies, launchers, or other mixed mechanics where they are not needed for that contained route. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Contacting a sealed shell edge
- **WHEN** the player reaches an enclosed gravity room shell outside its authored entry or exit door opening
- **THEN** the shell blocks traversal as a room wall
- **AND** the player cannot pass through that sealed shell edge

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages. Across that rollout, each room MUST also keep a gravity-focused interior layout whose primary authored beats are room entry, in-room gravity traversal, disable-button access, and room exit, rather than a legacy bundle of unrelated room-local mechanics.

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
- **AND** each room still reads as a gravity-focused traversal segment rather than a mixed-mechanic bundle