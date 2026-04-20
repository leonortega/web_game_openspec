## MODIFIED Requirements

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the denser 8-bit presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, explicit state-shape changes, or bounded internal pixel detail rather than subtle shading alone. Under this pass, enemy and hazard rendering MUST use richer sprite-like pixel structure than the current coarse baseline while keeping routing-critical threat differences readable. Supported enemy art refreshes for this pass MUST remain original to the project rather than directly copying supplied reference art. Flying ovni or flyer enemies MUST place their brightest running-light or glow accents on the underside hull, belly rim, or other lower-body surface so they read as underside-lit saucers rather than top-capped drones. This presentation tightening MUST NOT change enemy behavior, projectile cadence, hazard timing, or encounter authoring.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the denser stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, accent, or pixel-detail change that remains readable in the bounded palette

#### Scenario: Tightening threat visuals without changing threat timing
- **WHEN** the denser 8-bit presentation pass is applied to enemies, hazards, and projectiles
- **THEN** their visuals become richer in sprite-like pixel detail without losing readability
- **AND** their telegraph timing and active danger cadence remain unchanged

#### Scenario: Preserving routing-critical readability under the tighter pass
- **WHEN** the player compares different enemies or hazards under the denser pixel treatment
- **THEN** the threats remain distinguishable through shape, spacing, motion state, reserved accents, or bounded pixel structure rather than fine texture noise alone

#### Scenario: Reading the refreshed flyer silhouette
- **WHEN** the player approaches a visible flying enemy after the visual refresh
- **THEN** the enemy reads as an underside-lit saucer or ovni through lower-hull accent placement and silhouette shape
- **AND** that refresh does not depend on directly copying the supplied reference image