## ADDED Requirements

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