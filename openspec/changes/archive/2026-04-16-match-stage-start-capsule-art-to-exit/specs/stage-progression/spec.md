## ADDED Requirements

### Requirement: Fresh stage-start capsule art reuse preserves existing arrival flow
The game SHALL render the fresh stage-start grounded cabin through the same authored capsule art treatment used by the stage-completion exit while preserving the existing fresh-start arrival contract. Exact art reuse MUST NOT change the fixed grounded cabin position, bounded rematerialization timing, scripted pre-control walk-out, post-walk door-close beat, or checkpoint-respawn bypass behavior already required for the stage-start sequence.

#### Scenario: Starting a fresh stage with exact exit-capsule art
- **WHEN** the player enters a fresh stage attempt or normal next-stage auto-advance
- **THEN** the stage-start cabin uses the same authored capsule art treatment as the completion exit
- **AND** the existing rematerialization, scripted walk-out, and control-unlock ordering remains unchanged

#### Scenario: Respawning from a checkpoint after art reuse
- **WHEN** the player respawns from a checkpoint within the same stage attempt
- **THEN** the checkpoint path still bypasses the stage-start cabin arrival sequence
- **AND** exact exit-art reuse does not cause the start-cabin presentation to replay on that respawn