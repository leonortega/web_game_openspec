## ADDED Requirements

### Requirement: Temporary bridge state resets on respawn and fresh attempts
The game SHALL treat scanner-switch temporary bridges as live traversal timing state rather than checkpoint-persistent route discovery. Every scanner switch and temporary bridge MUST start inactive, hidden, and non-solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST rebuild temporary bridge state from that inactive baseline instead of preserving any prior activation or remaining timer value. A checkpoint snapshot MUST NOT restore an already active temporary bridge, even if the checkpoint was activated while that bridge was live before the player died.

#### Scenario: Dying after activating a temporary bridge
- **WHEN** the player activates a scanner switch, starts its linked bridge timer, and then dies before completing the route
- **THEN** the next life restores the scanner switch and bridge as inactive, hidden, and non-solid until retriggered

#### Scenario: Respawning from a later checkpoint after bridge activation
- **WHEN** the player activates a temporary bridge and then reaches a checkpoint before dying later in the same stage
- **THEN** respawning from that checkpoint does not preserve the bridge activation or remaining timer and requires the bridge to be retriggered

#### Scenario: Starting a fresh attempt after prior use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously activating a temporary bridge
- **THEN** every scanner switch and temporary bridge starts again from its inactive, hidden, and non-solid state
