## MODIFIED Requirements

### Requirement: The player can unlock new abilities over progression
The game SHALL provide a compact set of block-granted powers that expand movement or combat options across the stage sequence. These powers MUST be earned from authored interactive blocks rather than being tied to a specific stage milestone.

#### Scenario: Unlocking a new movement power
- **WHEN** the player activates an authored reward block
- **THEN** a new ability becomes available for the current run

#### Scenario: Retaining an unlocked power
- **WHEN** the player enters a later stage after earning a power and not losing it
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
The game SHALL communicate ability behavior through consistent input, outcome, and feedback so the player can reliably learn each power. If the player is hurt or dies, the game MUST clear the active powers before the next respawned attempt.

#### Scenario: Activating a movement power
- **WHEN** the player performs the required input for an authored power
- **THEN** the game triggers the same movement or combat effect consistently

#### Scenario: Attempting an unavailable power
- **WHEN** the player tries to use a power that has not been granted
- **THEN** the game does not grant the effect

#### Scenario: Keeping powers across stages
- **WHEN** the player completes one stage without losing their active powers
- **THEN** those powers remain available in the next stage

#### Scenario: Losing powers after damage
- **WHEN** the player is hurt or dies
- **THEN** the game clears the player's active powers before the next attempt
