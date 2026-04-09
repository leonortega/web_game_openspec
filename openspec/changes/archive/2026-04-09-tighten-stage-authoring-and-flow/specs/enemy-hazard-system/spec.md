## ADDED Requirements

### Requirement: Grounded enemies are anchored to supported movement lanes
The game SHALL place all non-flying enemies on supported platform or floor surfaces. Grounded enemies MUST spawn on platform tops or floor-level support and MUST keep their movement within valid supported lane limits instead of hovering in air or moving beyond platform footing.

#### Scenario: Spawning a grounded enemy
- **WHEN** a walker, hopper, charger, or turret is authored into a stage
- **THEN** the enemy appears on supported terrain rather than floating above or clipping below the intended surface

#### Scenario: Patrolling as a grounded enemy
- **WHEN** a grounded enemy moves along its authored route
- **THEN** its movement stays within the supported limits of the terrain it is meant to occupy

### Requirement: Non-pit hazards are anchored to reachable support surfaces
The game SHALL place authored non-pit hazards only on reachable floor or platform support surfaces. A spike or lava hazard MUST appear attached to the terrain it threatens and MUST NOT float in unsupported airspace.

#### Scenario: Encountering a spike or lava hazard
- **WHEN** the player reaches a non-pit hazard
- **THEN** the hazard is visibly grounded on a reachable supported surface

#### Scenario: Validating authored hazards
- **WHEN** stage content is checked by automated validation
- **THEN** unsupported or floating non-pit hazards fail validation
