## MODIFIED Requirements

### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step before active control starts, and completion MUST flow through a readable stage-clear results step before continuing. A stage MUST only be marked complete when the player reaches the exit in a valid active state and any authored lightweight stage objective for that stage is already complete. Stages without an authored lightweight stage objective MUST continue to complete immediately on valid exit contact. Stages with an authored lightweight stage objective MUST keep the route to that exit readable and MUST provide immediate in-stage feedback if the player touches the exit before the required objective is complete.

#### Scenario: Beginning a stage
- **WHEN** the player enters a level
- **THEN** the game shows a short stage presentation before gameplay begins in an active state

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit on a standard stage
- **WHEN** the player reaches the exit while alive on a stage without an authored lightweight objective
- **THEN** the stage is marked complete and the stage-clear flow begins

#### Scenario: Reaching the exit before completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is still incomplete
- **THEN** the stage is not marked complete
- **AND** the game presents immediate feedback that the objective still remains

#### Scenario: Reaching the exit after completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is complete
- **THEN** the stage is marked complete and the stage-clear flow begins

## ADDED Requirements

### Requirement: Selected stages can author lightweight mission objectives
The game SHALL allow a bounded subset of stages to author one lightweight mission objective using existing contact, volume, checkpoint, or activation patterns instead of a separate mission system. For this change, supported objective fiction MUST be limited to restoring a beacon, reactivating a relay, or powering a lift tower. Each objective-authored stage MUST track a single stage-local objective that starts incomplete on a fresh attempt, becomes complete when its authored target interaction succeeds, and remains complete for the rest of that stage attempt including later checkpoint respawns. Manual restart or a fresh stage start MUST reset that objective to incomplete. The game MUST communicate objective briefing and incomplete-exit reminders through the existing transient stage-message flow rather than requiring a new mission screen or separate persistent HUD panel.

#### Scenario: Starting an objective-authored stage
- **WHEN** the player begins a stage that authors a lightweight mission objective
- **THEN** the game communicates the current objective through the existing stage-message flow near the start of active play

#### Scenario: Completing an authored objective target
- **WHEN** the player triggers the authored contact, volume, checkpoint, or activation target bound to that stage objective
- **THEN** the stage objective becomes complete for the current attempt

#### Scenario: Respawning after objective completion
- **WHEN** the player dies after completing the authored stage objective and then respawns from a checkpoint in the same stage attempt
- **THEN** the objective remains complete after the respawn

#### Scenario: Starting a fresh attempt after prior objective progress
- **WHEN** the player manually restarts the stage or begins a new attempt after previously completing its lightweight objective
- **THEN** the objective resets to incomplete for that new attempt