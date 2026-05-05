## MODIFIED Requirements

### Requirement: Levels track total coins for a full-clear reward
The game SHALL track all coins placed in a level and the player's collection total for that level. The coin total MUST be readable enough for the player to understand whether a full-clear reward is still available. Within the same stage run, runtime MUST track aggregate full-collection milestone state (`allCoinsRecovered`) separately from per-coin collected state so full-clear messaging and reward gating can remain deterministic across updates and checkpoint restores. Checkpoint respawns in the same stage run MUST preserve both the current per-coin collection truth and the aggregate full-collection milestone state for that run. Fresh stage attempts such as manual restart or new stage entry MUST rebuild collectible state and reset that milestone for the new attempt.

#### Scenario: Preserving aggregate full-collection state after checkpoint respawn
- **WHEN** the player has already collected every research sample in the current stage run and later respawns from an activated survey beacon
- **THEN** the full-collection milestone state remains recovered for that same run
- **AND** full-clear reward logic does not re-trigger as if that milestone were newly reached

#### Scenario: Resetting full-collection milestone on fresh attempt
- **WHEN** the player manually restarts the stage or begins a new stage attempt after previously collecting every research sample
- **THEN** the stage resets per-coin collection truth and the aggregate full-collection milestone for the new attempt