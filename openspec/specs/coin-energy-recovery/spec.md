# coin-energy-recovery Specification

## Purpose
TBD - created by archiving change add-menu-power-blocks-and-coins. Update Purpose after archive.
## Requirements
### Requirement: Levels track total coins for a full-clear reward
The game SHALL track all coins placed in a level and the player's collection total for that level. The coin total MUST be readable enough for the player to understand whether a full-clear reward is still available. Player-facing HUD, stage messaging, and transition copy for that collectible progress MUST present those pickups as research samples and MUST keep the nouning consistent when comparing stage-local and run-total totals. Within the same stage run, checkpoint respawns MUST preserve which finite level coins have already been collected and MUST preserve the player's current level coin total. Runtime MUST also track an aggregate full-collection milestone state (`allCoinsRecovered`) separately from per-coin collection so full-clear reward and messaging logic stays deterministic after checkpoint restores. Fresh stage attempts such as manual restart or new stage entry MUST rebuild the full level coin set normally and reset the aggregate full-collection milestone for that new attempt.

#### Scenario: Collecting a coin
- **WHEN** the player collects a research-sample pickup in the level
- **THEN** the player's current research-sample total increases

#### Scenario: Seeing remaining coins
- **WHEN** the player has not yet collected every research sample in the level
- **THEN** the game still treats the full-clear reward as pending

#### Scenario: Respawning after collecting coins
- **WHEN** the player respawns from an activated survey beacon in the same stage run after collecting research samples earlier
- **THEN** already collected coins remain unavailable and the current research-sample total remains unchanged

#### Scenario: Preserving aggregate full-collection state after checkpoint respawn
- **WHEN** the player has already collected every research sample in the current stage run and later respawns from an activated survey beacon
- **THEN** the full-collection milestone state remains recovered for that same run
- **AND** full-clear reward logic does not re-trigger as if that milestone were newly reached

#### Scenario: Starting a fresh attempt
- **WHEN** the player manually restarts the stage or begins a new stage attempt
- **THEN** the level rebuilds its authored collectible set and resets the current research-sample total for that attempt

### Requirement: Collecting every coin restores full energy
The game SHALL restore the player's full energy when the player collects every coin in the current level. The full-energy restore MUST happen only once the level coin set is complete, and it MUST NOT trigger again after a checkpoint respawn in the same stage run. Player-facing full-clear messaging for this milestone MUST describe the completed set as every research sample in the level.

#### Scenario: Collecting the final coin
- **WHEN** the player collects the last remaining research sample in the level
- **THEN** the game restores the player's energy to full

#### Scenario: Missing at least one coin
- **WHEN** the player reaches the end of the level without collecting every research sample
- **THEN** the full-energy restore does not trigger

#### Scenario: Respawning after a full-clear reward
- **WHEN** the player respawns from a survey beacon after already collecting every research sample in the level during that stage run
- **THEN** the game does not grant an additional full-energy restore for the same completed coin set

### Requirement: Research-sample rewards use bounded celebratory feedback
The game SHALL reinforce research-sample collection and the full-collection energy restore with bounded retro feedback animation. Individual research-sample pickups MUST trigger a brief readable collection accent, and the final pickup that restores full energy MUST trigger a more noticeable but still short-lived celebration burst. These effects MUST remain checkpoint-safe, MUST NOT replay for already collected samples after a checkpoint respawn in the same run, and MUST NOT obscure nearby hazards or route-critical terrain.

#### Scenario: Collecting a normal research sample
- **WHEN** the player collects a research sample that is not the final remaining sample in the level
- **THEN** the game plays a brief collection accent such as a sparkle, pop, or pickup burst
- **AND** the effect resolves quickly enough to preserve active-play readability

#### Scenario: Collecting the final research sample in the level
- **WHEN** the player collects the last remaining research sample and the full-energy restore triggers
- **THEN** the game plays a stronger celebration accent than a normal sample pickup
- **AND** that celebration remains bounded in size and duration relative to the active gameplay space

#### Scenario: Respawning after collecting samples from a checkpoint
- **WHEN** the player respawns from a survey beacon after previously collecting authored samples in the same stage run
- **THEN** already collected samples do not replay their pickup celebration on respawn
- **AND** the visual feedback remains consistent with the checkpoint-safe collection persistence rules

