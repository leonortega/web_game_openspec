## ADDED Requirements

### Requirement: View-relevant enemy audibility preserves fairness and turret exceptions
The game SHALL make enemy motion, charge, or presence cues audible when the enemy becomes visible in the active camera view or enters an already-supported turret lead-margin that communicates imminent in-view danger. Viewpoint gating MUST remain tied to player-readable threat relevance rather than generic simulation activity, and it MUST NOT change enemy attack cadence, projectile timing, hazard timing, or encounter layout. Enemies that remain off-screen and not yet view-relevant MUST NOT emit repetitive presence audio.

#### Scenario: An enemy enters the camera view
- **WHEN** an enemy becomes visible in the active camera view while audio is available
- **THEN** the game may begin that enemy's readable motion, presence, or telegraph cue at that point

#### Scenario: A turret uses the existing lead-margin exception
- **WHEN** a turret reaches the supported lead-margin state that already warns of imminent in-view fire
- **THEN** its telegraph or firing cue may become audible before the turret is fully visible
- **AND** the exception preserves the current fairness semantics rather than becoming generic off-screen enemy audibility

#### Scenario: An enemy remains off-screen and not yet relevant
- **WHEN** an enemy continues simulating outside the active camera view and outside any supported lead-margin telegraph window
- **THEN** the game does not emit repetitive motion or presence audio for that enemy

## MODIFIED Requirements

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the denser 8-bit presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, explicit state-shape changes, or bounded internal pixel detail rather than subtle shading alone. Under this pass, enemy and hazard rendering MUST use richer sprite-like pixel structure than the current coarse baseline while keeping routing-critical threat differences readable. This presentation tightening MUST NOT change enemy behavior, projectile cadence, hazard timing, or encounter authoring.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the denser stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, accent, or pixel-detail change that remains readable in the bounded palette

#### Scenario: Tightening threat visuals without changing threat timing
- **WHEN** the denser 8-bit pass is applied to enemies, hazards, and projectiles
- **THEN** their visuals become richer in sprite-like pixel detail without losing readability
- **AND** their telegraph timing and active danger cadence remain unchanged

#### Scenario: Preserving routing-critical readability under the tighter pass
- **WHEN** the player compares different enemies or hazards under the denser pixel treatment
- **THEN** the threats remain distinguishable through shape, spacing, motion state, reserved accents, or bounded pixel structure rather than fine texture noise alone