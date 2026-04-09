## ADDED Requirements

### Requirement: Core gameplay HUD information is grouped at the top of the screen
The game SHALL present core gameplay status such as stage identity, progression, score or crystal count, health, and active powers in a single top-aligned HUD band during active play.

#### Scenario: Starting a stage
- **WHEN** the player enters active gameplay
- **THEN** the core gameplay HUD appears at the top of the screen as one grouped interface

#### Scenario: Reading gameplay status quickly
- **WHEN** the player glances at the HUD during movement or combat
- **THEN** the most important gameplay values can be read without looking between separated screen regions

### Requirement: Nonessential HUD content does not compete with core gameplay status
The game SHALL avoid keeping nonessential instructional or duplicated status cards in a persistent lower HUD area during active play.

#### Scenario: Playing during traversal
- **WHEN** the player is moving through a stage
- **THEN** persistent HUD content emphasizes gameplay status instead of secondary instructional panels
