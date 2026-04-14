# interactive-blocks Specification

## Purpose
Define authored interactive block behavior, fixed power grants, and player-facing naming for reward-giving stage blocks.

## Requirements

### Requirement: Power blocks grant only the supported fixed powers
The game SHALL support exactly four authored powers from interactive blocks, backed by the existing fixed mechanics: double jump displayed as `Thruster Burst`, shooter displayed as `Plasma Blaster`, invincible for 10 seconds displayed as `Shield Field`, and dash displayed as `Booster Dash`. A power block MUST grant one of those fixed powers, MUST preserve its existing mechanic and duration, and MUST not randomize outside that set or introduce additional power types.

#### Scenario: Granting Thruster Burst
- **WHEN** the player activates a block authored for the double-jump power
- **THEN** the player receives the existing double-jump mechanic and the game presents it as `Thruster Burst`

#### Scenario: Granting Plasma Blaster
- **WHEN** the player activates a block authored for the shooter power
- **THEN** the player receives the existing shooter mechanic and the game presents it as `Plasma Blaster`

#### Scenario: Granting Shield Field
- **WHEN** the player activates a block authored for temporary invincibility
- **THEN** the player becomes invincible for 10 seconds and the game presents the power as `Shield Field`

#### Scenario: Granting Booster Dash
- **WHEN** the player activates a block authored for dash
- **THEN** the player receives the existing dash mechanic and the game presents it as `Booster Dash`