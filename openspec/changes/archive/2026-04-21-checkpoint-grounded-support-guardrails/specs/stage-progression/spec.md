## MODIFIED Requirements

### Requirement: Checkpoints update respawn progress within a stage
The game SHALL support in-level checkpoints that update the player's respawn location after activation. Stages targeting the long-form duration requirement MUST include enough checkpoint coverage that a late-stage failure does not force the player to replay most of the stage. Player-facing gameplay and stage messaging for those checkpoints MUST present them as survey beacons while preserving the existing checkpoint activation, respawn, and persistence behavior. A checkpoint MUST appear on an intended reachable route before the terminal exit it serves and MUST NOT be positioned past the stage exit door or other stage-completion trigger. Every valid survey beacon MUST be visibly grounded on stable authored support at the same route location where it is activated, and checkpoint recovery MUST restore the player from that grounded support contract rather than from an unchecked beacon rectangle or a respawn-only vertical offset. A checkpoint respawn within the same stage run MUST preserve already collected finite level coins and the current stage coin total, while fresh stage starts or manual restarts MUST rebuild collectible state normally.

#### Scenario: Activating a checkpoint
- **WHEN** the player touches an inactive survey beacon
- **THEN** that checkpoint becomes the active respawn point for the current stage
- **AND** the active beacon remains visibly grounded on the same stable authored support where it was reached

#### Scenario: Dying after checkpoint activation
- **WHEN** the player dies after activating a survey beacon
- **THEN** the game respawns the player at that checkpoint
- **AND** the recovery position resolves from the grounded authored support at that survey beacon instead of from a respawn-only Y correction

#### Scenario: Respawning with prior coin progress
- **WHEN** the player respawns from an activated survey beacon after collecting research samples earlier in the same stage run
- **THEN** the checkpoint restore keeps those collected coins removed and preserves the current stage coin total

#### Scenario: Failing late in a long stage
- **WHEN** the player fails in a late stage segment after activating the nearest survey beacon
- **THEN** the active checkpoint places them near that portion of progress instead of near the stage start
- **AND** that late-stage recovery still starts from grounded stable support on the intended route

#### Scenario: Approaching the final exit
- **WHEN** authored stage data places checkpoints near the final exit route
- **THEN** every valid checkpoint remains before the exit trigger on an intended reachable route
- **AND** no checkpoint is authored beyond the point where stage completion already occurs

#### Scenario: Restarting the stage after prior checkpoint progress
- **WHEN** the player manually restarts the stage or begins a fresh stage attempt
- **THEN** the stage rebuilds its collectible state instead of preserving prior survey-beacon coin progress

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain or equally stable route support that is visible to the player. A checkpoint MUST read as grounded at its beacon base and MUST NOT be positioned on moving, falling, temporary, hidden, or otherwise unsafe footing. A checkpoint MUST avoid overlapping immediate enemy or hazard threat zones. Validation and authored checkpoint audit coverage MUST reject placements that depend on invisible helper support, trigger-box hacks, respawn-only Y fixes, or isolated one-off content nudges without reusable grounded-support guardrails.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on visible stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger
- **AND** that recovery location still corresponds to the beacon's grounded support rather than to hidden helper geometry

#### Scenario: Rejecting an unsupported checkpoint
- **WHEN** authored stage validation evaluates a checkpoint whose beacon base lacks visible stable support on the intended route or only passes by using hidden helper support, trigger-box expansion, or respawn-only offset correction
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Auditing authored checkpoints under grounded guardrails
- **WHEN** focused validation or scripted audit coverage runs across authored stage checkpoints after the grounded-support guardrails are introduced
- **THEN** every checkpoint either passes the reusable grounded-support rule or is reported for authored correction
