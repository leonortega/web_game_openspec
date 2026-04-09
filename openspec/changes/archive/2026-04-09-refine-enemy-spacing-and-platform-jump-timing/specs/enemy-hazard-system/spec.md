## ADDED Requirements

### Requirement: Static grounded threats keep clear margin from platform edges
The game SHALL place static grounded threats such as turrets and fixed spike hazards with clear distance from the edges of their supporting platform. These threats MUST avoid corner-hugging placement and SHOULD occupy the middle portion of the platform unless a deliberate authored exception exists.

#### Scenario: Encountering a turret on a platform
- **WHEN** the player reaches a platform with a turret
- **THEN** the turret is not authored at or immediately adjacent to the platform edge

#### Scenario: Encountering a fixed spike hazard on a platform
- **WHEN** the player reaches a platform with a static spike hazard
- **THEN** the hazard leaves readable landing or movement space away from the platform corners

### Requirement: Hopping enemies create strong vertical pressure
The game SHALL tune hopping enemies so their jump behavior presents clearly stronger vertical pressure than ordinary ground patrol enemies.

#### Scenario: Encountering a hopping enemy
- **WHEN** the player enters a section with a hopping enemy
- **THEN** the enemy's jump arc is tall enough to create a distinct vertical timing challenge

#### Scenario: Comparing patrol and hopping threats
- **WHEN** the player observes both threat types across repeated encounters
- **THEN** the hopping enemy reads as a higher vertical threat than a standard patrol enemy
