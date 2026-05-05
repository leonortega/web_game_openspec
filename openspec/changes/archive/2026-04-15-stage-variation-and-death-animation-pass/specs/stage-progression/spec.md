## ADDED Requirements

### Requirement: Main-stage terrain and gravity rollout stays authored and verifiable
The game SHALL author every current main stage with at least one terrain-surface section and at least one gravity-field section that satisfy the platform-variation contract for that stage's route role. Validation MUST reject any current main stage that omits terrain-surface authored data, omits gravity-field authored data, or places those mechanics only in unreadable dead-end space disconnected from the intended route or optional reconnecting branch. Scripted or automated playtest coverage MUST exercise at least one authored terrain-surface beat and one authored gravity-field beat in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, and those checks MUST confirm the routes remain readable, completable, and reset-consistent across death, checkpoint respawn, and fresh attempts.

#### Scenario: Loading a main stage with missing rollout data
- **WHEN** a current main stage is authored without either a terrain-surface section or a gravity-field section
- **THEN** validation rejects that stage before runtime use

#### Scenario: Running campaign rollout coverage
- **WHEN** scripted or automated playtest coverage runs for the current three-stage campaign
- **THEN** the suite exercises one terrain-surface beat and one gravity-field beat in each main stage
- **AND** it confirms those sections remain completable after retry or respawn

## MODIFIED Requirements

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Player-facing gameplay and stage messaging for those checkpoints MUST present them as survey beacons while preserving the existing checkpoint activation, respawn, and persistence behavior. A checkpoint MUST appear on an intended reachable route before the terminal exit it serves and MUST NOT be positioned past the stage exit door or other stage-completion trigger. A checkpoint respawn within the same stage run MUST preserve already collected finite level coins and the current stage coin total, while fresh stage starts or manual restarts MUST rebuild collectible state normally.

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

#### Scenario: Approaching the final exit
- **WHEN** authored stage data places checkpoints near the final exit route
- **THEN** every valid checkpoint remains before the exit trigger on an intended reachable route
- **AND** no checkpoint is authored beyond the point where stage completion already occurs

#### Scenario: Restarting the stage after prior checkpoint progress
- **WHEN** the player manually restarts the stage or begins a fresh stage attempt
- **THEN** the stage rebuilds its collectible state instead of preserving prior survey-beacon coin progress