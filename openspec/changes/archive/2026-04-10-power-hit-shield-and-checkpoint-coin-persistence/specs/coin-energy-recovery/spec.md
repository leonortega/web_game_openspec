## MODIFIED Requirements

### Requirement: Levels track total coins for a full-clear reward
The game SHALL track all coins placed in a level and the player's collection total for that level. The coin total MUST be readable enough for the player to understand whether a full-clear reward is still available. Within the same stage run, checkpoint respawns MUST preserve which finite level coins have already been collected and MUST preserve the player's current level coin total. Fresh stage attempts such as manual restart or new stage entry MUST rebuild the full level coin set normally.

#### Scenario: Collecting a coin
- **WHEN** the player collects a coin in the level
- **THEN** the player's current coin total increases

#### Scenario: Seeing remaining coins
- **WHEN** the player has not yet collected every coin in the level
- **THEN** the game still treats the full-clear reward as pending

#### Scenario: Respawning after collecting coins
- **WHEN** the player respawns from an activated checkpoint in the same stage run
- **THEN** already collected coins remain unavailable and the current level coin total remains unchanged

#### Scenario: Starting a fresh attempt
- **WHEN** the player manually restarts the stage or begins a new stage attempt
- **THEN** the level rebuilds its authored coin set and resets the current level coin total for that attempt

### Requirement: Collecting every coin restores full energy
The game SHALL restore the player's full energy when the player collects every coin in the current level. The full-energy restore MUST happen only once the level coin set is complete, and it MUST NOT trigger again after a checkpoint respawn in the same stage run.

#### Scenario: Collecting the final coin
- **WHEN** the player collects the last remaining coin in the level
- **THEN** the game restores the player's energy to full

#### Scenario: Missing at least one coin
- **WHEN** the player reaches the end of the level without collecting every coin
- **THEN** the full-energy restore does not trigger

#### Scenario: Respawning after a full-clear reward
- **WHEN** the player respawns from a checkpoint after already collecting every coin in the level during that stage run
- **THEN** the game does not grant an additional full-energy restore for the same completed coin set