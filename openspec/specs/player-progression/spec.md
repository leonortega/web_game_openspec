# player-progression Specification

## Purpose
Define a lightweight player power progression system that adds mastery, route variation, and a sense of growth across the game's stages.
## Requirements
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
The game SHALL communicate ability behavior through consistent input, outcome, and feedback so the player can reliably learn each power. If the player is hurt while one or more active non-invincible powers are present and invincibility is not active, the hit MUST clear those active powers and MUST NOT remove health. If invincibility is active when the player is hurt, the hit MUST preserve invincibility for the remainder of its timer, MUST keep health unchanged for that hit, and MUST still clear any other active non-invincible powers. If the player is hurt with no active powers, the normal health-loss rule MUST still apply. If the player dies, the game MUST clear the active powers before the next respawned attempt.

#### Scenario: Activating a movement power
- **WHEN** the player performs the required input for an authored power
- **THEN** the game triggers the same movement or combat effect consistently

#### Scenario: Attempting an unavailable power
- **WHEN** the player tries to use a power that has not been granted
- **THEN** the game does not grant the effect

#### Scenario: Keeping powers across stages
- **WHEN** the player completes one stage without losing their active powers
- **THEN** those powers remain available in the next stage

#### Scenario: Losing powers instead of health on a non-invincible powered hit
- **WHEN** the player is hurt while at least one active non-invincible power is present and invincibility is not active
- **THEN** the game clears those non-invincible active powers and keeps the current health unchanged

#### Scenario: Retaining invincibility on a protected hit
- **WHEN** the player is hurt while invincibility is active
- **THEN** invincibility remains active until its timer expires and the hit does not remove health

#### Scenario: Clearing other powers while invincible
- **WHEN** the player is hurt while invincibility and another active power are both present
- **THEN** the game preserves invincibility and clears the other active power states for that hit

#### Scenario: Losing health when unpowered
- **WHEN** the player is hurt while no active powers are present
- **THEN** the game applies the normal health-loss rule

#### Scenario: Losing powers after death
- **WHEN** the player dies
- **THEN** the game clears the player's active powers before the next attempt

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

### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step before active control starts, and completion MUST flow through a readable stage-clear results step before continuing. A stage MUST only be marked complete when the player reaches the exit in a valid active state, and the route to that exit MUST support sustained progression across a long-form stage structure.

#### Scenario: Beginning a stage
- **WHEN** the player enters a level
- **THEN** the game shows a short stage presentation before gameplay begins in an active state

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit
- **WHEN** the player reaches the stage exit while alive
- **THEN** the stage is marked complete and the stage-clear flow begins

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
The game SHALL unlock the next stage in the MVP sequence after the current stage is completed, and the normal non-final completion flow SHALL continue automatically toward that next stage after the stage-clear results screen.

#### Scenario: Completing an early stage
- **WHEN** the player completes a stage that is not the final stage in the MVP sequence
- **THEN** the next stage becomes available and the game continues automatically after the results screen

#### Scenario: Returning after prior completion
- **WHEN** the player returns to the stage selection flow after completing a stage
- **THEN** previously unlocked stages remain available

### Requirement: Main stages sustain at least 20 minutes of first-time play
The game SHALL author each main stage so that an average first-time player requires at least 20 minutes to complete it under intended play conditions. The stage duration MUST be achieved through meaningful gameplay content such as traversal segments, hazards, enemy encounters, optional detours, and checkpointed sub-goals rather than empty travel distance.

#### Scenario: First-time stage completion target
- **WHEN** a main stage is playtested by a first-time average player following the intended route
- **THEN** the stage takes at least 20 minutes to complete

#### Scenario: Stage duration is driven by gameplay content
- **WHEN** stage content is extended to meet the duration target
- **THEN** the added time comes from authored gameplay segments and not from long empty movement sections

### Requirement: Stages are divided into multiple pacing segments
The game SHALL structure each main stage into multiple authored segments with distinct challenge emphasis, recovery beats, or environmental transitions so that progression remains readable across the doubled route length.

#### Scenario: Progressing through a long stage
- **WHEN** the player advances through a main stage
- **THEN** they encounter multiple recognizable segments instead of a single continuous challenge band

#### Scenario: Recovery after a difficulty spike
- **WHEN** the player completes a high-pressure section
- **THEN** the stage provides a short recovery or reset beat before the next major escalation

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain. A checkpoint MUST NOT be positioned on moving, falling, or otherwise unsafe footing, and it MUST avoid overlapping immediate enemy or hazard threat zones.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours. Punchable interactive blocks MUST leave enough vertical clearance between the floor and the block for the player to reach them from below.

#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow

#### Scenario: Punching a block from below
- **WHEN** the player jumps upward beneath an interactive block
- **THEN** the block is reachable from below without requiring an impossible jump arc

