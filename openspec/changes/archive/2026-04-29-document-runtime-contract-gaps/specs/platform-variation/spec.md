## MODIFIED Requirements

### Requirement: Authored gravity fields create bounded airborne traversal variants
The game SHALL support authored gravity inversion columns, anti-grav streams, and low-gravity zones as bounded rectangular field variants for airborne traversal. All three field kinds MUST affect only the player and only airborne vertical acceleration behavior. An anti-grav stream MUST apply continuous upward-biased airborne acceleration while the player remains inside its authored rectangle and MUST NOT become grounded support, a one-shot launcher, or a generalized lift route. A gravity inversion column MUST reverse ongoing airborne vertical acceleration while the player remains inside its authored rectangle and MUST restore normal gravity immediately on exit. A low-gravity zone MUST apply a bounded reduced-gravity scale while the player remains inside its authored rectangle and MUST restore the surrounding gravity rule immediately on exit. None of these field kinds MUST change enemy or projectile gravity, grounded walking orientation, or arbitrary horizontal or vector-force physics.

#### Scenario: Entering a low-gravity zone
- **WHEN** the player becomes airborne inside an authored low-gravity zone rectangle
- **THEN** the zone applies its authored reduced-gravity scale only while the player remains inside that rectangle
- **AND** leaving that rectangle restores the surrounding gravity rule immediately

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream, one gravity inversion column, or one low-gravity zone to a visible room shell, one side-wall entry door opening, one separate side-wall exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked gravity field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. Each enclosed gravity room MUST preserve one bounded intended deactivation lane from room entry to the interior disable button while the room field is active; authored enemy placement and support geometry in that room MUST NOT block or collapse that lane.

#### Scenario: Reaching the deactivation lane under active room pressure
- **WHEN** the player enters an active enclosed gravity room that contains authored interior enemies or hazards
- **THEN** the intended route to the interior disable button remains traversable using the room's current gravity rule and existing movement rules
- **AND** authored validation rejects layouts that make that bounded lane non-viable before disable