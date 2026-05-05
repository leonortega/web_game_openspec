## MODIFIED Requirements

### Requirement: Grounded enemies and floor hazards stay on visible support
The game SHALL treat player-visible authored ground contact as the source of truth for grounded non-flying enemies and floor-bound hazards. Grounded placement MUST preserve footed contact for walkers, hoppers, turrets, chargers, spikes, and comparable floor-bound threats on the intended route, encounter pad, or equally readable local support surface, and authored source coordinates for those threats MUST already sit flush to that support before runtime use. Validation, stage building, catalog ingestion, runtime setup, and rendering MUST reject or report unsupported placements instead of masking them through hidden helper support, blanket Y-offset fudges, render-only cheats, globally loosened support tolerances, default snap-to-ground fallback, or hover-like recovery for non-flying threats. Focused automated coverage MUST report authored entries whose visible footing or first grounded action depends on tolerant normalization, runtime correction, or art-only bottom-edge compensation rather than obvious authored contact.

#### Scenario: Spawning a grounded enemy on its patrol support
- **WHEN** a stage spawns a non-flying enemy on an authored route segment
- **THEN** that enemy resolves with visible foot contact on the intended support surface
- **AND** its grounded movement starts from that same support instead of from an airborne correction

#### Scenario: Starting a hopper jump from authored ground contact
- **WHEN** a stage spawns a grounded hopper enemy that immediately begins its first jump cycle
- **THEN** the hopper starts from visible authored support rather than from an already-airborne placement
- **AND** the jump does not rely on spawn-time snap-to-ground or hover fallback to look correct

#### Scenario: Spawning a floor hazard on readable support
- **WHEN** a stage spawns a floor-bound hazard that threatens an intended traversal line
- **THEN** the hazard aligns to visible local floor or support geometry
- **AND** the threat does not read as hovering above the route it controls

#### Scenario: Rejecting authored grounded threats that need fallback grounding
- **WHEN** authored stage data places a non-flying enemy or floor-bound hazard so it only appears grounded after support search tolerance, runtime snap-to-ground, or render-only adjustment
- **THEN** validation, stage setup, or focused audit coverage reports that placement for correction before normal play
- **AND** the fix path does not keep fallback grounding as the primary mechanism

#### Scenario: Leaving flyers unchanged
- **WHEN** a hover enemy or other flyer is evaluated under grounded-placement guardrails
- **THEN** its existing hover behavior and placement rules remain unchanged
- **AND** it is not forced onto floor contact by the grounded-support contract

#### Scenario: Auditing authored grounded threat placement across shipped stages
- **WHEN** focused automated validation checks shipped grounded non-flying enemy and floor-hazard entries in authored stage catalog
- **THEN** each entry already sits on readable intended support in source data
- **AND** validation reports entries whose visible footing or first grounded action depends on tolerant normalization, runtime correction, or art-only compensation