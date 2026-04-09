## ADDED Requirements

### Requirement: Checkpoints are placed on safe and stable footing
The game SHALL place checkpoints only on authored locations that are safely reachable and supported by stable terrain. A checkpoint MUST NOT be positioned on moving, falling, or otherwise unsafe footing, and it MUST avoid overlapping immediate enemy or hazard threat zones.

#### Scenario: Reaching a checkpoint
- **WHEN** the player arrives at a checkpoint location
- **THEN** the checkpoint stands on stable support and can be activated without requiring unsafe contact

#### Scenario: Respawning at a checkpoint
- **WHEN** the player respawns from an activated checkpoint
- **THEN** they return to a safe location that does not immediately drop them into danger

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours.

#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow
