## MODIFIED Requirements

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the Atari 2600-inspired presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, or explicit state-shape changes rather than subtle shading alone. Under the second-pass tightening, enemy and hazard rendering MUST use harsher palette quantization and tighter sprite-like visual motion limits than the current baseline presentation while keeping routing-critical threat differences readable. This presentation tightening MUST NOT change enemy behavior, projectile cadence, hazard timing, or encounter authoring.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the flatter stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, or accent change that is readable in the reduced palette

#### Scenario: Tightening threat visuals without changing threat timing
- **WHEN** the second-pass retro tightening is applied to enemies, hazards, and projectiles
- **THEN** their visuals become more quantized and sprite-like
- **AND** their telegraph timing and active danger cadence remain unchanged

#### Scenario: Preserving routing-critical readability under the tighter pass
- **WHEN** the player compares different enemies or hazards under the harsher palette limits
- **THEN** the threats remain distinguishable through shape, spacing, motion state, or reserved accent placement rather than fine texture detail alone