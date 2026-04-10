# gameplay-hud Specification

## Purpose
Define the in-game HUD layout for core gameplay status and top-of-screen presentation.
## Requirements
### Requirement: Core gameplay HUD information is grouped at the top of the screen
The game SHALL present core gameplay status such as stage identity, coin count, health, and active powers in a single horizontal top-aligned HUD band during active play. The primary stage label in that HUD band MUST show only the authored stage name and MUST NOT append duration, distance, or similar planning suffixes. Secondary stage metadata such as run label and segment name SHALL appear as tiny bottom-right text instead of inside the primary HUD band.

#### Scenario: Starting a stage
- **WHEN** the player enters active gameplay
- **THEN** the core gameplay HUD appears at the top of the screen as one grouped horizontal interface

#### Scenario: Reading gameplay status quickly
- **WHEN** the player glances at the HUD during movement or combat
- **THEN** stage, coins, health, and power can be read without scanning separate interface regions

#### Scenario: Reading the stage label
- **WHEN** the player reads the primary HUD stage label during active play
- **THEN** the label shows only the stage name without a duration or distance suffix

#### Scenario: Reading secondary stage metadata
- **WHEN** the player wants run or segment context
- **THEN** the tiny bottom-right text provides that information without adding a second large HUD block

### Requirement: Nonessential HUD content does not compete with core gameplay status
The game SHALL avoid keeping nonessential instructional or duplicated status cards in a persistent lower HUD area during active play. Secondary metadata such as run and segment SHALL be relegated to compact corner text rather than a large persistent panel.

#### Scenario: Playing during traversal
- **WHEN** the player is moving through a stage
- **THEN** persistent HUD content emphasizes gameplay status instead of secondary instructional panels

#### Scenario: Viewing run metadata
- **WHEN** the player checks the current run or segment context
- **THEN** the information appears as tiny corner text instead of a large boxed HUD card

