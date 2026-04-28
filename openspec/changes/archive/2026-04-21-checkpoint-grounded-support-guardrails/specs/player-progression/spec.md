## MODIFIED Requirements

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Active checkpoint recovery MUST use the same grounded authored support contract as the survey beacon that the player activated, and MUST NOT derive recovery solely from a raw checkpoint rectangle or a respawn-only vertical adjustment.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive checkpoint
- **THEN** that checkpoint becomes the active respawn point for the current stage
- **AND** the checkpoint anchor corresponds to grounded authored support at that route location

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a checkpoint
- **THEN** the game respawns the player at that checkpoint
- **AND** the respawn starts from the checkpoint's grounded support instead of from an unsupported rectangle plus a one-off Y fix

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start
- **AND** the late-stage recovery point remains grounded on authored support

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable visible footing. A checkpoint MUST NOT be positioned on moving, falling, temporary, hidden, or otherwise unsafe support, and it MUST avoid overlapping immediate enemy or hazard threat zones. The progression system MUST reject checkpoint placements that only appear valid because of invisible support helpers, trigger-box hacks, or respawn-only position correction.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on visible stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger
- **AND** that safe location still reflects the checkpoint's grounded authored support