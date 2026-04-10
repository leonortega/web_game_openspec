## MODIFIED Requirements

### Requirement: Player can take damage and recover through respawn
The game SHALL track player health or hit state, apply damage from enemies and hazards, and return the player to active play through death and respawn rules. When the player collides with a damaging enemy or hazard while any active block-granted power is present, the game MUST clear all active powers and MUST NOT reduce health for that hit. When the player has no active powers, damaging contact MUST reduce health as normal. The respawn flow MUST place the player at the most recently activated checkpoint or level start.

#### Scenario: Taking damage from a threat while unpowered
- **WHEN** the player collides with a damaging enemy or hazard and has no active powers
- **THEN** the game applies damage or loss of health to the player

#### Scenario: Consuming powers on a protected hit
- **WHEN** the player collides with a damaging enemy or hazard while any active powers are present
- **THEN** the game clears the active powers and does not remove health for that hit

#### Scenario: Losing all health
- **WHEN** the player reaches the defeat condition
- **THEN** the game triggers a death state and restarts the player from the current respawn point

#### Scenario: Respawning from a checkpoint
- **WHEN** the player has activated a checkpoint before dying
- **THEN** the player respawns at that checkpoint instead of the stage start

#### Scenario: Losing powers after death
- **WHEN** the player dies after taking damage
- **THEN** the game clears the player's active powers