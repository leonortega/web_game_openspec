## MODIFIED Requirements

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain or equally stable route support that is visible to the player. A checkpoint MUST read as grounded at its beacon base and MUST NOT be positioned on moving, falling, temporary, hidden, or otherwise unsafe footing. A checkpoint MUST avoid overlapping immediate enemy or hazard threat zones. The visible beacon footing and the checkpoint respawn anchor MUST resolve from the same authored grounded-support contract at that route location rather than from separate trigger-box expansion, render-only placement nudges, respawn-only Y correction, invisible helper support, default runtime snap-to-ground normalization, or globally loosened support tolerances. Validation, stage building, runtime setup, and focused checkpoint audit coverage MUST reject placements that depend on those cheats or on isolated one-off content nudges instead of reusable grounded-support guardrails.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on visible stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger
- **AND** that recovery location still corresponds to the beacon's grounded support rather than to hidden helper geometry, runtime snap correction, or a respawn-only offset

#### Scenario: Rejecting an unsupported checkpoint
- **WHEN** authored stage validation evaluates a checkpoint whose beacon base lacks visible stable support on the intended route or only passes by using hidden helper support, trigger-box expansion, render-only placement nudges, respawn-only offset correction, or runtime snap-to-ground normalization
- **THEN** validation rejects that stage data before runtime use

#### Scenario: Auditing authored checkpoints under grounded guardrails
- **WHEN** focused validation or checkpoint audit coverage runs across authored stage checkpoints after the grounded-support guardrails are introduced
- **THEN** every checkpoint either passes the reusable grounded-support rule or is reported for authored correction
- **AND** each valid checkpoint keeps its visible beacon footing and respawn anchor aligned to the same stable authored support

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours. Any authored interactive or route prop that visually rests on floor support, including grounded checkpoint-adjacent rewards or comparable floor-anchored static stage elements, MUST already use visible authored support in source data instead of relying on runtime snap, hidden helper support, or render-only vertical correction. Punchable interactive blocks MUST leave enough vertical clearance between the floor and the block for the player to reach them from below, and the intended route after collecting any reward from a block MUST remain safely traversable without requiring immediate enemy contact, including contact with non-stompable hazard enemies.

#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow

#### Scenario: Loading a floor-anchored route prop or interactive
- **WHEN** a stage loads an authored interactive or static route prop that is intended to sit on local floor support
- **THEN** that object resolves from visible authored support at the same route location
- **AND** it does not depend on hidden support, snap fallback, or render-only Y nudges to look grounded

#### Scenario: Punching a block from below
- **WHEN** the player jumps upward beneath an interactive block
- **THEN** the block is reachable from below without requiring an impossible jump arc

#### Scenario: Continuing after collecting a coin
- **WHEN** the player collects a coin reward from an authored block
- **THEN** the intended route ahead remains safely traversable without forcing an immediate enemy hit or unavoidable contact with a hazard enemy