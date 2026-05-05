## ADDED Requirements

### Requirement: Reveal-platform traversal state follows attempt and checkpoint progression
The game SHALL treat reveal-platform discovery as traversal state within the current stage attempt. Every reveal platform MUST start hidden and non-solid on a fresh attempt. When the player enters the linked reveal volume, that platform MUST become visible and solid for the rest of the current attempt. If the player activates a checkpoint after that reveal occurs, the checkpoint state MUST preserve the revealed platform and restore it on later respawns from that checkpoint. If the player respawns from a checkpoint that was activated before the reveal occurred, or starts a fresh attempt, the platform MUST reset to hidden and non-solid.

#### Scenario: Revealing a platform before activating a checkpoint
- **WHEN** the player reveals a platform and then activates a checkpoint in the same attempt
- **THEN** later respawns from that checkpoint restore the platform in its revealed and solid state

#### Scenario: Activating a checkpoint before revealing a platform
- **WHEN** the player activates a checkpoint and only later reveals a platform before dying
- **THEN** respawning from that earlier checkpoint resets the platform to hidden and non-solid

#### Scenario: Starting a fresh attempt after a prior reveal
- **WHEN** the player restarts the stage or begins a new attempt after previously revealing a platform
- **THEN** each reveal platform starts hidden and non-solid again until its reveal volume is triggered