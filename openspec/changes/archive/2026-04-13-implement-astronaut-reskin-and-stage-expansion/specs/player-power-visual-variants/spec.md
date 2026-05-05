## MODIFIED Requirements

### Requirement: Each supported power changes the player's presentation
The game SHALL present the default player as an astronaut-themed base variant and SHALL apply a distinct astronaut-suit visual variant for each supported active power, using different color treatment, suit accents, asset treatment, or both. Each power variant MUST align with its player-facing display name: `Thruster Burst`, `Plasma Blaster`, `Shield Field`, and `Booster Dash`. When the power is cleared, the player SHALL return to the base astronaut presentation.

#### Scenario: Gaining a supported power
- **WHEN** the player gains a supported block-granted power
- **THEN** the player switches to the matching astronaut-themed power variant

#### Scenario: Comparing power variants
- **WHEN** the player has different supported powers active in separate runs
- **THEN** each power presents a clearly distinct astronaut-themed look

#### Scenario: Clearing a power
- **WHEN** the player's active power is cleared
- **THEN** the player returns to the base astronaut presentation