## MODIFIED Requirements

### Requirement: Grounded enemies and floor hazards stay on visible support
The game SHALL treat authored visible support as the source of truth for grounded non-flying enemies and floor-bound hazards. Grounded placement MUST preserve footed contact for walkers, hoppers, turrets, chargers, spikes, and comparable floor-bound threats on the intended route, encounter pad, or equally readable local support surface, and authored source coordinates for those threats MUST already sit flush to that support before runtime use. Validation, stage building, runtime setup, and rendering MUST reject or report unsupported placements instead of masking them through blanket Y-offset fudges, invisible helper floors, globally loosened support tolerances, render-only cheats, or default snap-to-ground fallback for non-flying threats. Focused automated coverage MUST report authored entries whose visible footing depends on tolerant normalization, runtime correction, or art-only bottom-edge compensation rather than obvious authored contact.

#### Scenario: Spawning a grounded enemy on its patrol support
- **WHEN** a stage spawns a non-flying enemy on an authored route segment
- **THEN** that enemy resolves with visible foot contact on the intended support surface
- **AND** its grounded movement starts from that same support instead of from an airborne correction

#### Scenario: Spawning a floor hazard on readable support
- **WHEN** a stage spawns a floor-bound hazard that threatens an intended traversal line
- **THEN** the hazard aligns to visible local floor or support geometry
- **AND** the threat does not read as hovering above the route it controls

#### Scenario: Rejecting authored grounded threats that need runtime correction
- **WHEN** authored stage data places a non-flying enemy or floor-bound hazard so it only appears grounded after runtime snap-to-ground, tolerant normalization, or render-only adjustment
- **THEN** validation or stage setup reports that placement for correction before normal play
- **AND** the fix path does not keep the runtime correction as the primary grounding mechanism

#### Scenario: Leaving flyers unchanged
- **WHEN** a hover enemy or other flyer is evaluated under grounded-placement guardrails
- **THEN** its existing hover behavior and placement rules remain unchanged
- **AND** it is not forced onto floor contact by the grounded-support contract

#### Scenario: Auditing authored grounded threat placement across shipped stages
- **WHEN** focused automated validation checks shipped grounded non-flying enemy and floor-hazard entries in authored stage catalog
- **THEN** each entry already sits on readable intended support in source data
- **AND** validation reports entries whose visible footing depends on tolerant normalization, runtime correction, or art-only compensation