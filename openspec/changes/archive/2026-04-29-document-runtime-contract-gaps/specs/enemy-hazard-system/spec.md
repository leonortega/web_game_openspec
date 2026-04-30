## ADDED Requirements

### Requirement: Turret variants stay readable through bounded telegraph presentation
The game SHALL allow authored turret visual variants while preserving one consistent turret threat contract. Every turret variant MUST keep the same threat cadence and collision semantics as the base turret behavior, and variant differences MUST remain presentation-level readability cues such as bounded base color, telegraph color, and projectile color. Telegraph progression MUST remain short, local, and readable, and MUST NOT depend on hidden timing branches that change the underlying turret threat contract.

#### Scenario: Reading two turret variants in different stages
- **WHEN** the player encounters turret variants with different authored color treatment
- **THEN** each turret still reads as the same threat class with the same telegraph-to-fire behavior
- **AND** the variant styling only changes readability cues rather than core combat semantics

### Requirement: Hopper authored placement preserves first-landing reachability
The game SHALL require authored hopper placement to keep first-action jump and landing outcomes reachable from visible intended support. Hopper entries MUST begin from readable authored ground contact and MUST keep initial hop timing and landing geometry within bounded reachable ranges on the intended route. Validation MUST report hopper placements whose first landing depends on hidden corrections, unsupported geometry, or unreachable startup trajectories.

#### Scenario: Loading a hopper with valid first landing
- **WHEN** a stage loads an authored grounded hopper encounter
- **THEN** the hopper starts from visible support and its first landing remains reachable on intended route geometry

#### Scenario: Rejecting an unreachable hopper startup path
- **WHEN** authored hopper placement causes the initial hop or first landing to miss reachable intended support
- **THEN** validation reports that authored data for correction before runtime use