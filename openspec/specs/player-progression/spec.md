# player-progression Specification

## Purpose
Define a lightweight player power progression system that adds mastery, route variation, and a sense of growth across the game's stages.

## Requirements
### Requirement: The player can unlock new abilities over progression
The game SHALL provide a compact set of unlockable player powers that expand movement or combat options across the stage sequence.

#### Scenario: Unlocking a new movement power
- **WHEN** the player reaches the defined progression milestone
- **THEN** a new ability becomes available for future play

#### Scenario: Retaining an unlocked power
- **WHEN** the player enters a later stage after unlocking a power
- **THEN** that power remains available during gameplay

### Requirement: Powers deepen traversal without invalidating stage design
The game SHALL design powers so they create alternate routes, safer recovery options, or mastery expression without bypassing the core progression path.

#### Scenario: Using a power on the intended route
- **WHEN** the player uses an unlocked ability in a standard stage section
- **THEN** the section remains readable and completable without breaking progression flow

#### Scenario: Using a power for mastery
- **WHEN** the player revisits or replays a stage with unlocked powers
- **THEN** they can access more efficient or more expressive traversal opportunities

### Requirement: Powers have clear gameplay rules
The game SHALL communicate ability behavior through consistent input, outcome, and feedback so the player can reliably learn each power.

#### Scenario: Activating a movement power
- **WHEN** the player performs the required input for an unlocked power
- **THEN** the game triggers the same movement or combat effect consistently

#### Scenario: Attempting an unavailable power
- **WHEN** the player tries to use a power that has not been unlocked
- **THEN** the game does not grant the effect

### Requirement: Progression ties to stage or collectible milestones
The game SHALL connect ability unlocks to clear progression milestones such as stage completion, collectible thresholds, or both.

#### Scenario: Unlocking through collectible progress
- **WHEN** the player reaches the required crystal or reward threshold
- **THEN** the corresponding ability becomes available

#### Scenario: Completing a stage milestone
- **WHEN** the player clears the authored progression gate for a power
- **THEN** the next ability tier unlocks according to design

### Requirement: The active power state is visible to the player
The game SHALL surface unlocked or currently relevant power information through HUD, menu, or equivalent readable feedback.

#### Scenario: Starting a stage with unlocked abilities
- **WHEN** gameplay begins
- **THEN** the player can identify which progression powers are available

#### Scenario: Gaining a new power
- **WHEN** the player unlocks an ability
- **THEN** the game provides feedback that the new power is now part of the player's moveset
