# enemy-hazard-system Specification

## Purpose
Define shooter-enemy firing behavior and related hazard gating during stage play.

## ADDED Requirements

### Requirement: Shooter enemies only fire while visible in the camera view
The game SHALL suppress shooter enemy firing, bullet emission, bullet visuals, and firing audio while the shooter is outside the active camera view. Once the shooter becomes visible in the camera/viewbox, the shooter MAY resume normal firing and associated audio/visual cues.

#### Scenario: Shooter begins off-screen
- **WHEN** a shooter enemy is present but outside the camera/viewbox
- **THEN** it does not emit bullets or play bullet sounds

#### Scenario: Shooter enters view
- **WHEN** the shooter becomes visible inside the camera/viewbox
- **THEN** bullet projectiles and bullet sound cues can appear for that enemy
