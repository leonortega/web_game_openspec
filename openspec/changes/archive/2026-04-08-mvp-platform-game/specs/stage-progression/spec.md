## ADDED Requirements

### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, and completion exit. A stage MUST only be marked complete when the player reaches the exit in a valid active state.

#### Scenario: Beginning a stage
- **WHEN** the player enters a level
- **THEN** the character spawns at the stage start and gameplay begins in an active state

#### Scenario: Reaching the exit
- **WHEN** the player reaches the stage exit while alive
- **THEN** the stage is marked complete

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive checkpoint
- **THEN** that checkpoint becomes the active respawn point for the current stage

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a checkpoint
- **THEN** the game respawns the player at that checkpoint

### Requirement: Stages support optional collectible rewards
The game SHALL include collectible items within stages that reward exploration or clean traversal without blocking stage completion.

#### Scenario: Collecting an item
- **WHEN** the player touches a collectible item
- **THEN** the item is removed from the stage and added to the player's current collection total

#### Scenario: Completing a stage without all collectibles
- **WHEN** the player reaches the exit without collecting every optional item
- **THEN** the stage still completes successfully

### Requirement: Stage completion unlocks forward progression
The game SHALL unlock the next stage in the MVP sequence after the current stage is completed.

#### Scenario: Completing an early stage
- **WHEN** the player completes a stage that is not the final stage in the MVP sequence
- **THEN** the next stage becomes available to play

#### Scenario: Returning after prior completion
- **WHEN** the player returns to the stage selection flow after completing a stage
- **THEN** previously unlocked stages remain available
