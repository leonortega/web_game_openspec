## MODIFIED Requirements

### Requirement: Each supported power changes the player's presentation
The game SHALL present the default player as an astronaut-themed base variant and SHALL apply a distinct astronaut-suit visual variant for each supported active power. Under the Atari 2600-inspired presentation pass, the base variant and each supported power variant MUST use coarse silhouette-first shapes, flat fills, and a very small concurrent color vocabulary rather than detail-heavy rendering. Each power variant MUST align with its player-facing display name: `Thruster Burst`, `Plasma Blaster`, `Shield Field`, and `Booster Dash`. Each supported power MUST remain readable at gameplay scale through a distinct silhouette cue, accent placement, or other clearly visible shape treatment rather than only a subtle hue swap. When the power is cleared, the player SHALL return to the base astronaut presentation.

#### Scenario: Gaining a supported power
- **WHEN** the player gains a supported block-granted power
- **THEN** the player switches to the matching astronaut-themed power variant in the reduced-detail retro style

#### Scenario: Comparing power variants
- **WHEN** the player has different supported powers active in separate runs
- **THEN** each power presents a clearly distinct astronaut-themed look that remains differentiable despite the limited palette

#### Scenario: Reading a power state during active play
- **WHEN** the player views their current avatar while moving through a stage
- **THEN** the active power state is identifiable through a visible silhouette or accent change that does not depend only on fine texture detail

#### Scenario: Clearing a power
- **WHEN** the player's active power is cleared
- **THEN** the player returns to the base astronaut presentation