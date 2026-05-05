## MODIFIED Requirements

### Requirement: Selected stages can author lightweight mission objectives
The game SHALL allow a bounded subset of stages to author one lightweight mission objective using existing contact, volume, checkpoint, or activation patterns instead of a separate mission system. For this change, supported objective fiction MUST be limited to restoring a beacon, reactivating a relay, or powering a lift tower. Each objective-authored stage MUST track a single stage-local objective that starts incomplete on a fresh attempt, becomes complete when its authored target interaction succeeds, and remains complete for the rest of that stage attempt including later checkpoint respawns. Manual restart or a fresh stage start MUST reset that objective to incomplete. The game MUST communicate objective briefing and incomplete-exit reminders through the existing transient stage-message flow rather than requiring a new mission screen or separate persistent HUD panel. During active play, that transient stage-message flow MUST use the lower-left HUD safe-area lane close to the bottom-left edge so briefings and reminders stay readable without displacing the primary top HUD band or colliding with persistent readouts.

#### Scenario: Starting an objective-authored stage
- **WHEN** the player begins a stage that authors a lightweight mission objective
- **THEN** the game communicates the current objective through the existing lower-left stage-message flow near the bottom-left edge at the start of active play

#### Scenario: Completing an authored objective target
- **WHEN** the player triggers the authored contact, volume, checkpoint, or activation target bound to that stage objective
- **THEN** the stage objective becomes complete for the current attempt

#### Scenario: Reminding the player about an incomplete objective
- **WHEN** the player reaches the exit while the authored lightweight objective is still incomplete
- **THEN** the reminder reuses the transient lower-left stage-message flow near the bottom-left edge during active play
- **AND** the game does not create a separate persistent mission panel for that reminder

#### Scenario: Respawning after objective completion
- **WHEN** the player dies after completing the authored stage objective and then respawns from a checkpoint in the same stage attempt
- **THEN** the objective remains complete after the respawn

#### Scenario: Starting a fresh attempt after prior objective progress
- **WHEN** the player manually restarts the stage or begins a new attempt after previously completing its lightweight objective
- **THEN** the objective resets to incomplete for that new attempt