## MODIFIED Requirements

### Requirement: Each supported power changes the player's presentation
The game SHALL present the default player as an astronaut-themed base variant and SHALL apply a distinct astronaut-suit visual variant for each supported active power. Under this denser 8-bit gameplay pass, the base variant and each supported power variant MUST use readable sprite-like pixel detail, flat fills, and a tightly bounded concurrent color vocabulary rather than the current overly coarse rendering. Each power variant MUST align with its player-facing display name: `Thruster Burst`, `Plasma Blaster`, `Shield Field`, and `Booster Dash`. Each supported power MUST remain readable at gameplay scale through a distinct silhouette cue, accent placement, visor or suit detail, or other clearly visible shape treatment rather than only a subtle hue swap or added noise. When the power is cleared, the player SHALL return to the base astronaut presentation. Increasing visual detail MUST NOT change any power mechanic, duration, or control behavior.

#### Scenario: Gaining a supported power
- **WHEN** the player gains a supported block-granted power
- **THEN** the player switches to the matching astronaut-themed power variant in the denser 8-bit style

#### Scenario: Comparing power variants
- **WHEN** the player has different supported powers active in separate runs
- **THEN** each power presents a clearly distinct astronaut-themed look that remains differentiable despite the limited palette

#### Scenario: Reading a power state during active play
- **WHEN** the player views their current avatar while moving through a stage
- **THEN** the active power state is identifiable through visible silhouette or accent detail that does not depend on fine subpixel texture or only a hue change

#### Scenario: Clearing a power
- **WHEN** the player's active power is cleared
- **THEN** the player returns to the base astronaut presentation

#### Scenario: Adding detail without changing mechanics
- **WHEN** the denser 8-bit pass is applied to player power variants
- **THEN** any extra visual detail remains presentation-only and readable at gameplay scale
- **AND** the underlying power behavior and timing remain unchanged