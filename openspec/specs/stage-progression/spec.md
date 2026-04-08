# stage-progression Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST only be marked complete when the player reaches the exit in a valid active state, and the route to that exit MUST support sustained progression across a long-form stage structure.

#### Scenario: Beginning a stage
- **WHEN** the player enters a level
- **THEN** the character spawns at the stage start and gameplay begins in an active state

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit
- **WHEN** the player reaches the stage exit while alive
- **THEN** the stage is marked complete

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive checkpoint
- **THEN** that checkpoint becomes the active respawn point for the current stage

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a checkpoint
- **THEN** the game respawns the player at that checkpoint

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start

### Requirement: Stages support optional collectible rewards
The game SHALL include collectible items within stages that reward exploration or clean traversal without blocking stage completion. In long-form stages, collectibles MUST be distributed across early, middle, and late segments so optional rewards remain relevant throughout the run.

#### Scenario: Collecting an item
- **WHEN** the player touches a collectible item
- **THEN** the item is removed from the stage and added to the player's current collection total

#### Scenario: Completing a stage without all collectibles
- **WHEN** the player reaches the exit without collecting every optional item
- **THEN** the stage still completes successfully

#### Scenario: Optional content appears beyond the opening segment
- **WHEN** the player reaches middle or late portions of a long stage
- **THEN** optional collectibles are still available in those later segments

### Requirement: Stage completion unlocks forward progression
The game SHALL unlock the next stage in the MVP sequence after the current stage is completed.

#### Scenario: Completing an early stage
- **WHEN** the player completes a stage that is not the final stage in the MVP sequence
- **THEN** the next stage becomes available to play

#### Scenario: Returning after prior completion
- **WHEN** the player returns to the stage selection flow after completing a stage
- **THEN** previously unlocked stages remain available

### Requirement: Main stages sustain at least 10 minutes of first-time play
The game SHALL author each main stage so that an average first-time player requires at least 10 minutes to complete it under intended play conditions. The stage duration MUST be achieved through meaningful gameplay content such as traversal segments, hazards, enemy encounters, optional detours, and checkpointed sub-goals rather than empty travel distance.

#### Scenario: First-time stage completion target
- **WHEN** a main stage is playtested by a first-time average player following the intended route
- **THEN** the stage takes at least 10 minutes to complete

#### Scenario: Stage duration is driven by gameplay content
- **WHEN** stage content is extended to meet the duration target
- **THEN** the added time comes from authored gameplay segments and not from long empty movement sections

### Requirement: Stages are divided into multiple pacing segments
The game SHALL structure each main stage into multiple authored segments with distinct challenge emphasis, recovery beats, or environmental transitions so that progression remains readable across a longer runtime.

#### Scenario: Progressing through a long stage
- **WHEN** the player advances through a main stage
- **THEN** they encounter multiple recognizable segments instead of a single continuous challenge band

#### Scenario: Recovery after a difficulty spike
- **WHEN** the player completes a high-pressure section
- **THEN** the stage provides a short recovery or reset beat before the next major escalation

