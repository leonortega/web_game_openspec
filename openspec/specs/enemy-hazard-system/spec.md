# enemy-hazard-system Specification

## Purpose
Define enemy hazard behavior and layout constraints during stage play.
## Requirements
### Requirement: The game does not use pit hazards
The game SHALL not author, render, or evaluate `pit` as a hazard kind. Falling out of bounds remains a valid death condition, but holes in the stage MUST be represented through level geometry and out-of-bounds death rather than a dedicated pit hazard element.

#### Scenario: Falling beyond the play area
- **WHEN** the player falls below the traversable world
- **THEN** the game triggers the existing death flow without requiring a pit hazard

#### Scenario: Validating stage hazard kinds
- **WHEN** stage content is checked for hazard kinds
- **THEN** `pit` is rejected or absent from the authored hazard set

### Requirement: Lava hazards are represented as spikes
The game SHALL represent former `lava` hazard placements as spikes. The authored stage content MUST use `spikes` for damaging hot-surface style hazards instead of a separate lava hazard kind.

#### Scenario: Loading authored stage content
- **WHEN** a stage includes a former lava hazard location
- **THEN** that location is authored as spikes

#### Scenario: Rendering hazards
- **WHEN** the game draws a hazard that used to be lava
- **THEN** it appears using the spike hazard visual treatment

### Requirement: Static spikes and shooting enemies do not share a support surface
The game SHALL keep static spike hazards and turret-style shooting enemies separated so they do not occupy the same support platform area. If authored content places them on the same platform, the content MUST be adjusted so one of the two moves to a different readable support location.

#### Scenario: Turret and spike on the same platform
- **WHEN** a turret and a spike hazard are authored onto one support surface
- **THEN** the stage content places at least one of them on a different supported location

#### Scenario: Loading a stage with turrets and spikes
- **WHEN** a stage is loaded
- **THEN** the active layout keeps spikes and turrets from sharing the same platform space

### Requirement: Shooter enemies only fire while visible in the camera view
The game SHALL suppress shooter enemy firing, bullet emission, bullet visuals, and firing audio while the shooter is outside the active camera view. Once the shooter becomes visible in the camera/viewbox, the shooter MAY resume normal firing and associated audio/visual cues.

#### Scenario: Shooter begins off-screen
- **WHEN** a shooter enemy is present but outside the camera/viewbox
- **THEN** it does not emit bullets or play bullet sounds

#### Scenario: Shooter enters view
- **WHEN** the shooter becomes visible inside the camera/viewbox
- **THEN** bullet projectiles and bullet sound cues can appear for that enemy

