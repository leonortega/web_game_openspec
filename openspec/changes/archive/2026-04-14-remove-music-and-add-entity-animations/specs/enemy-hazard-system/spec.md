## ADDED Requirements

### Requirement: Enemy and hazard motion feedback stays readable and deterministic
The game SHALL use bounded retro animation to communicate enemy movement and telegraph state without changing encounter fairness. Repeating enemy states such as idle watch, patrol or hover motion, windup, firing telegraph, and defeat feedback MUST read through deterministic low-frame pose changes, restrained tween accents, or both rather than purely static rendering. Hazard and enemy animation MUST remain subordinate to existing spacing, attack timing, projectile cadence, and telegraph windows.

#### Scenario: Reading an enemy before committing to an encounter
- **WHEN** the player approaches a visible enemy or hazard on the critical path
- **THEN** its current watch, movement, or telegraph state is readable through bounded motion or pose change
- **AND** the player is not required to infer that state from a fully static sprite alone

#### Scenario: Preserving telegraph fairness under animation
- **WHEN** an enemy or hazard enters a windup or firing telegraph state
- **THEN** the animation reinforces the existing dangerous state without shifting the underlying timing window
- **AND** retries preserve the same authored cadence and readable response window

#### Scenario: Keeping hazards readable in mixed encounters
- **WHEN** multiple enemies, hazards, or projectiles share the screen
- **THEN** their bounded animation remains legible enough to separate the routing-critical threat states
- **AND** the added motion does not become a constant wall of competing visual noise