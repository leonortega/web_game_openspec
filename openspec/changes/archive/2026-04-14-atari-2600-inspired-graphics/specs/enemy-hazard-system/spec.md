## ADDED Requirements

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the Atari 2600-inspired presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, or explicit state-shape changes rather than subtle shading alone.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the flatter stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, or accent change that is readable in the reduced palette

### Requirement: Reduced-palette rendering does not hide routing-critical threat differences
The game SHALL keep routing-critical threat differences readable even when multiple enemies or hazards share a limited color vocabulary. Threats that require materially different player responses MUST remain distinguishable through shape, spacing, motion state, or reserved accent placement rather than depending only on small texture details.

#### Scenario: Comparing different threat types in the same stage
- **WHEN** the player sees two different enemy or hazard types during a stage
- **THEN** the threats remain distinguishable enough to support route planning and response choice within the flatter presentation style

#### Scenario: Reading an active projectile
- **WHEN** a hazard or enemy projectile crosses the screen
- **THEN** the projectile remains visually distinct from background decoration and passive props