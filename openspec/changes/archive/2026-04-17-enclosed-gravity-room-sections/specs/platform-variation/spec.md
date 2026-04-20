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
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST include a room shell that fully contains its linked gravity field, platforms, enemies, hazards, pickups, and other authored room-local content; MUST provide separate bottom entry and bottom exit openings; MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state; and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path