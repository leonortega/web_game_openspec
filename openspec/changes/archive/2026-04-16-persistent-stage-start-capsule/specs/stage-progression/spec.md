## MODIFIED Requirements

### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step followed by a short bounded in-world capsule-arrival appearance beat before active control starts. Fresh stage starts, including direct stage entry from the menu or replay flow and automatic advance into the next stage after a normal results handoff, MUST use that arrival beat. That stage-start arrival beat MAY leave behind a fixed grounded capsule prop at the authored start position after the player appears, but the remaining prop MUST stay inert, MUST NOT accept interaction, and MUST resolve through a short post-reveal door-close animation before or as active control begins. Checkpoint respawns within the same stage attempt MUST NOT replay the pre-play presentation or the stage-start capsule arrival sequence, and they MUST NOT recreate the persistent start capsule as part of the respawn. Completion MUST flow through a readable in-world capsule-entry finish before continuing into the stage-clear results step. A stage MUST only be marked complete when the player reaches the exit in a valid active state and any authored lightweight stage objective for that stage is already complete. Stages without an authored lightweight stage objective MUST continue to accept valid exit contact immediately, but that accepted contact MUST start a short bounded exit-finish sequence before the normal stage-clear handoff. Stages with an authored lightweight stage objective MUST keep the route to that exit readable and MUST provide immediate in-stage feedback if the player touches the exit before the required objective is complete. The authored completion exit MUST remain a route-grounded endpoint with readable supporting footing or base geometry rather than a floating unsupported rectangle, and authored validation MUST reject exit placement that lacks that local support. The exit-finish sequence MUST keep the player non-interactive, MUST visually resolve the capsule-entry or dematerialization moment before the player disappears, MUST NOT restore normal player visibility after that disappearance begins, and MUST hand off to the normal stage-clear flow without changing stage ordering, unlock behavior, or objective gating semantics.

#### Scenario: Beginning a stage
- **WHEN** the player enters a fresh stage attempt
- **THEN** the game shows a short stage presentation before gameplay begins in an active state
- **AND** that presentation hands off into a short capsule-arrival appearance beat that may leave behind an inert grounded start capsule after the player appears

#### Scenario: Auto-advancing into the next stage
- **WHEN** the player completes a non-final stage and the game advances into the next stage
- **THEN** the next stage still begins through the normal pre-play presentation flow
- **AND** the new stage uses the same bounded capsule-arrival appearance beat before active control starts

#### Scenario: Respawning from a checkpoint
- **WHEN** the player dies after activating a checkpoint and respawns within the same stage attempt
- **THEN** the game restores play from the active checkpoint without replaying the pre-stage presentation
- **AND** the checkpoint respawn does not trigger the stage-start capsule-arrival sequence or recreate the persistent start capsule

#### Scenario: Closing the persistent start capsule
- **WHEN** a fresh stage-start arrival reveals the player at the authored spawn
- **THEN** the remaining start capsule plays a short bounded door-close animation before or as active control begins
- **AND** the capsule stays in the world afterward as a non-interactive grounded prop

#### Scenario: Advancing through a long stage
- **WHEN** the player moves from one major stage segment to the next
- **THEN** the game preserves a clear sense of forward progress toward the exit

#### Scenario: Reaching the exit on a standard stage
- **WHEN** the player reaches the exit while alive on a stage without an authored lightweight objective
- **THEN** the stage is marked complete and the bounded capsule-entry finish begins
- **AND** the normal stage-clear flow begins after that finish resolves

#### Scenario: Reaching the exit before completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight stage objective is still incomplete
- **THEN** the stage is not marked complete
- **AND** the game presents immediate feedback that the objective still remains

#### Scenario: Reaching the exit after completing the objective
- **WHEN** the player reaches the exit while alive on a stage whose authored lightweight objective is complete
- **THEN** the stage is marked complete and the bounded capsule-entry finish begins
- **AND** the normal stage-clear flow begins after that finish resolves

#### Scenario: Watching the exit finish resolve
- **WHEN** a valid stage exit overlap starts the capsule-entry finish
- **THEN** player control stops and the player disappears through a short in-world teleport or dematerialization beat
- **AND** normal player-part visibility does not resume before the results handoff
- **AND** the game does not create an alternate completion branch or require extra player input before the results handoff

#### Scenario: Rejecting an unsupported exit endpoint
- **WHEN** authored stage validation evaluates a completion exit whose rectangle lacks readable supporting footing or base geometry on the intended route
- **THEN** validation rejects that stage data before runtime use