## ADDED Requirements

### Requirement: Shooting and hazard enemies keep clear separation
The game SHALL keep turret-style shooting enemies and nearby hazard or grounded enemy placements separated so they do not occupy the same collision space or create visually overlapping encounter pressure. When authored content places them too close together, the stage setup MUST adjust the shooting enemy position to a valid nearby location instead of leaving the conflict in place.

#### Scenario: Encountering a turret near a hazard
- **WHEN** a turret would otherwise overlap or tightly crowd a nearby hazard or grounded enemy
- **THEN** the stage setup places the turret at a separate readable position on supported terrain

#### Scenario: Validating authored stage content
- **WHEN** a new stage is created or an existing stage is loaded
- **THEN** turret placement is checked against nearby hazards and grounded enemies before the encounter starts

### Requirement: Hopping enemies select a reachable landing platform
The game SHALL make hopping enemies choose a reachable supported platform target before jumping. A hopping enemy MUST only jump when the target landing platform is within its jump distance and vertical reach, and it MUST remain on supported terrain rather than falling into unsupported space when no valid target exists.

#### Scenario: Hopper approaching a gap
- **WHEN** a hopping enemy reaches the edge of its current supported platform
- **THEN** it selects a reachable next platform and jumps with enough impulse to land on it

#### Scenario: Hopper has no safe landing target
- **WHEN** no supported landing platform is reachable within the hopper's jump envelope
- **THEN** the hopper waits or retargets instead of jumping into a fall

#### Scenario: Repeating a hopper encounter
- **WHEN** the player retries the same hopper encounter
- **THEN** the hopper follows the same readable platform-to-platform pattern for that stage layout

