## ADDED Requirements

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored gravity capsule sections that bind one anti-grav stream or one gravity inversion column to a visible capsule shell and one nearby authored activation button. Each gravity capsule section MUST begin dormant on a fresh attempt, MUST leave its linked gravity field inactive while dormant, and MUST enable that linked field on the same update in which the player first gains eligible contact with the linked button. Once enabled, the section MUST stay enabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, or toggle-off logic. When enabled, the linked anti-grav stream or gravity inversion column MUST still affect only the player and only airborne vertical acceleration inside its authored bounds.

#### Scenario: Activating a gravity capsule section
- **WHEN** the player first gains eligible contact with a gravity capsule section's linked button
- **THEN** that capsule section becomes enabled on the same update
- **AND** its linked field remains enabled until a reset event occurs

#### Scenario: Entering an enabled anti-grav capsule section
- **WHEN** the player becomes airborne inside an enabled gravity capsule section whose linked field is an anti-grav stream
- **THEN** the section applies the normal anti-grav airborne acceleration only while the player remains inside the authored field bounds

#### Scenario: Entering an enabled gravity inversion capsule section
- **WHEN** the player becomes airborne inside an enabled gravity capsule section whose linked field is a gravity inversion column
- **THEN** the section reverses the player's ongoing airborne vertical acceleration only while the player remains inside the authored field bounds

#### Scenario: Passing through a dormant gravity capsule section
- **WHEN** the player enters the authored bounds of a gravity capsule section before its linked button has been triggered
- **THEN** that section does not apply anti-grav or gravity-inversion acceleration

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every gravity capsule section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST include readable capsule-local support geometry or a contained connector route within its shell footprint, MUST place its linked button on an intended reachable approach before the gated route it controls, and MUST remain safely retryable when the section is dormant until retriggered. A gravity capsule section MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained capsule route
- **WHEN** the player approaches an authored gravity capsule section
- **THEN** the shell, button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Skipping a dormant capsule route
- **WHEN** the player reaches a stage section whose gravity capsule route is still dormant
- **THEN** the surrounding stage remains safely retryable until the button is retriggered or the intended fallback line is used