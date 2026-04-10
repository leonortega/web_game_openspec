# player-power-visual-variants Specification

## Purpose
Define the player presentation variants that correspond to supported active powers.

## ADDED Requirements

### Requirement: Each supported power changes the player's presentation
The game SHALL apply a distinct player visual variant for each supported active power, using different color treatment, asset treatment, or both. Each power's visual variant MUST be clearly distinct from the others and MUST update when the power is granted. When the power is cleared, the player SHALL return to the base presentation.

#### Scenario: Gaining a supported power
- **WHEN** the player gains a supported block-granted power
- **THEN** the player switches to the matching power-specific visual variant

#### Scenario: Comparing power variants
- **WHEN** the player has different supported powers active in separate runs
- **THEN** each power presents a clearly distinct player look

#### Scenario: Clearing a power
- **WHEN** the player's active power is cleared
- **THEN** the player returns to the base visual presentation
