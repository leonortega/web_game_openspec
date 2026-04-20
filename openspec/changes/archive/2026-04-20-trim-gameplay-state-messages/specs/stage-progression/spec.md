## MODIFIED Requirements

### Requirement: Selected stages can author lightweight mission objectives
The game SHALL allow a bounded subset of stages to author one lightweight mission objective using existing contact, volume, checkpoint, or activation patterns instead of a separate mission system. For this change, supported objective fiction MUST be limited to restoring a beacon, reactivating a relay, or powering a lift tower. Each objective-authored stage MUST track a single stage-local objective that starts incomplete on a fresh attempt, becomes complete when its authored target interaction succeeds, and remains complete for the rest of that stage attempt including later checkpoint respawns. Manual restart or a fresh stage start MUST reset that objective to incomplete. The game MUST communicate objective briefing and incomplete-exit reminders through the existing transient stage-message flow rather than requiring a new mission screen or separate persistent HUD panel. During active play, that transient stage-message flow MUST use the lower-left HUD safe-area lane close to the bottom-left edge so briefings and reminders stay readable without displacing the primary top HUD band or colliding with persistent readouts. That same transient flow MAY also communicate checkpoint activation, route reveal, temporary bridge activation, power pickup, and major collectible milestone feedback, but it MUST NOT be seeded with long authored stage hints or segment-focus text on stage start and MUST NOT narrate generic combat outcomes that do not change player decisions.

#### Scenario: Starting an objective-authored stage
- **WHEN** the player begins a stage that authors a lightweight mission objective
- **THEN** the game communicates the current objective through the existing lower-left stage-message flow near the bottom-left edge at the start of active play

#### Scenario: Starting a non-objective stage
- **WHEN** the player begins a stage without an authored lightweight mission objective
- **THEN** the transient message lane does not open with a long authored route summary
- **AND** the player still gets persistent stage and segment context from the existing HUD labels

#### Scenario: Reaching a new authored segment
- **WHEN** the player crosses into a later authored segment during active play
- **THEN** the persistent segment label continues updating
- **AND** the transient message lane does not show the segment focus as a separate banner