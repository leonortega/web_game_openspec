## ADDED Requirements

### Requirement: Grounded enemies and floor hazards stay on visible support
The game SHALL keep non-flying enemies and floor-bound hazards visibly grounded on authored support that belongs to the intended route, encounter pad, or equally readable local support surface. Grounded placement MUST preserve footed contact for walkers, hoppers, turrets, and other non-flyers, and it MUST preserve readable floor contact for spikes, turrets anchored to floor support, and comparable floor-bound hazards. Validation, stage building, and runtime setup MUST reject or report unsupported placements instead of masking them through blanket Y-offset fudges, invisible helper floors, globally loosened support tolerances, render-only cheats, or hover-like fallback for non-flying threats.

#### Scenario: Spawning a grounded enemy on its patrol support
- **WHEN** a stage spawns a non-flying enemy on an authored route segment
- **THEN** that enemy resolves with visible foot contact on the intended support surface
- **AND** its grounded movement starts from that same support instead of from an airborne correction

#### Scenario: Spawning a floor hazard on readable support
- **WHEN** a stage spawns a floor-bound hazard that threatens an intended traversal line
- **THEN** the hazard aligns to visible local floor or support geometry
- **AND** the threat does not read as hovering above the route it controls

#### Scenario: Rejecting unsupported grounded threats
- **WHEN** authored stage data places a non-flying enemy or floor-bound hazard without visible intended support
- **THEN** validation or stage setup reports that placement for correction before normal play
- **AND** the fix path does not add hidden support or convert the threat into a hover-style actor

#### Scenario: Leaving flyers unchanged
- **WHEN** a hover enemy or other flyer is evaluated under grounded-placement guardrails
- **THEN** its existing hover behavior and placement rules remain unchanged
- **AND** it is not forced onto floor contact by the new grounded-support contract

#### Scenario: Auditing grounded threat placement across authored stages
- **WHEN** focused automated validation runs against authored enemy and hazard placements after the guardrails are introduced
- **THEN** each non-flying enemy and floor-bound hazard either passes the reusable grounded-support rule or is reported for authored correction