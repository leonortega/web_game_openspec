## ADDED Requirements

### Requirement: Levels track total coins for a full-clear reward
The game SHALL track all coins placed in a level and the player's collection total for that level. The coin total MUST be readable enough for the player to understand whether a full-clear reward is still available.

#### Scenario: Collecting a coin
- **WHEN** the player collects a coin in the level
- **THEN** the player's current coin total increases

#### Scenario: Seeing remaining coins
- **WHEN** the player has not yet collected every coin in the level
- **THEN** the game still treats the full-clear reward as pending

### Requirement: Collecting every coin restores full energy
The game SHALL restore the player's full energy when the player collects every coin in the current level. The full-energy restore MUST happen only once the level coin set is complete.

#### Scenario: Collecting the final coin
- **WHEN** the player collects the last remaining coin in the level
- **THEN** the game restores the player's energy to full

#### Scenario: Missing at least one coin
- **WHEN** the player reaches the end of the level without collecting every coin
- **THEN** the full-energy restore does not trigger
