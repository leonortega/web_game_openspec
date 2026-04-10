## MODIFIED Requirements

### Requirement: Shooter enemies only fire while visible in the camera view
The game SHALL suppress shooter enemy firing, bullet emission, bullet visuals, and firing audio while the shooter is outside the active camera view beyond a measurable lead margin. Once the shooter becomes visible within that configured lead margin before fully entering the camera/viewbox, the shooter MAY resume normal firing and associated audio/visual cues. The lead margin MUST be consistent and testable in world units or tile units.

#### Scenario: Shooter begins far off-screen
- **WHEN** a shooter enemy is present but outside the camera/viewbox and outside the lead margin
- **THEN** it does not emit bullets or play bullet sounds

#### Scenario: Shooter approaches the viewport edge
- **WHEN** the shooter reaches the configured lead margin before fully entering the camera/viewbox
- **THEN** bullet projectiles and bullet sound cues can appear for that enemy before its body is fully visible
