## MODIFIED Requirements

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Player-facing gameplay and stage messaging for those checkpoints MUST present them as survey beacons while preserving the existing checkpoint activation, respawn, and persistence behavior. A checkpoint respawn within the same stage run MUST preserve already collected finite level coins and the current stage coin total, while fresh stage starts or manual restarts MUST rebuild collectible state normally.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive survey beacon
- **THEN** that checkpoint becomes the active respawn point for the current stage

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a survey beacon
- **THEN** the game respawns the player at that checkpoint

#### Scenario: Respawning with prior coin progress
- **WHEN** the player respawns from an activated survey beacon after collecting research samples earlier in the same stage run
- **THEN** the checkpoint restore keeps those collected coins removed and preserves the current stage coin total

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment after activating the nearest survey beacon
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start

#### Scenario: Restarting the stage after prior checkpoint progress
- **WHEN** the player manually restarts the stage or begins a fresh stage attempt
- **THEN** the stage rebuilds its collectible state instead of preserving prior survey-beacon coin progress

### Requirement: Stages support optional collectible rewards
The game SHALL include collectible items within stages that reward exploration or clean traversal without blocking stage completion. In long-form stages, collectibles MUST be distributed across early, middle, and late segments so optional rewards remain relevant throughout the run. Player-facing pickup messaging, HUD progress labels, and transition totals for those optional rewards MUST present them as research samples without changing collectible counts or broader progression thresholds.

#### Scenario: Collecting an item
- **WHEN** the player touches a research sample pickup
- **THEN** the item is removed from the stage and added to the player's current collection total

#### Scenario: Completing a stage without all collectibles
- **WHEN** the player reaches the exit without collecting every research sample
- **THEN** the stage still completes successfully

#### Scenario: Optional content appears beyond the opening segment
- **WHEN** the player reaches middle or late portions of a long stage
- **THEN** optional research samples are still available in those later segments