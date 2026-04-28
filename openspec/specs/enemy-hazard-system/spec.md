# enemy-hazard-system Specification

## Purpose
Define enemy, hazard, and threat-readability behavior during stage play.
## Requirements
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

### Requirement: Hover enemies preserve hover-only fairness while using refreshed ovni presentation
The game SHALL keep supported hover enemies in their current hover-only threat role while using an original retro ovni presentation. Their refreshed art MUST preserve the existing collision or body footprint, fixed-lane patrol behavior, bobbing motion, and route fairness. The visible silhouette MUST read as a symmetric saucer or ovni with a bounded underside-light cue and clearer canopy-versus-hull separation than the current capped-drone read. This refresh MUST NOT add new attacks, change movement semantics, or depend on direct copying of supplied reference art.

#### Scenario: Reading a hover enemy in active play
- **WHEN** the player approaches a visible hover enemy after the refresh
- **THEN** the enemy reads as a symmetric ovni or saucer through silhouette and underside-light placement
- **AND** it still behaves like the same hover-only lane-patrol threat

#### Scenario: Preserving hover-enemy fairness
- **WHEN** the refreshed hover enemy patrols, bobs, or crosses the same authored route
- **THEN** its collision footprint and reach remain unchanged
- **AND** the player does not need to relearn spacing because of the presentation refresh

#### Scenario: Avoiding copied-reference art
- **WHEN** the refreshed hover enemy art is evaluated against supplied style reference
- **THEN** it reads as original project art inspired by that direction
- **AND** it does not directly trace or reproduce the supplied image

### Requirement: Hover-enemy blink polish remains optional and non-distracting
If refreshed hover enemies use blinking or shimmering running lights, that polish SHALL remain optional and visually secondary. Any blink treatment MUST stay local, low-frequency, and low-intensity enough that the enemy silhouette, path, and danger read remain clearer than the blink itself. The blink MUST NOT act as a new attack telegraph, state dependency, or distracting strobe effect.

#### Scenario: Showing a subtle blink accent
- **WHEN** a hover enemy uses optional light-blink polish during active play
- **THEN** the blink stays secondary to the enemy silhouette and movement read
- **AND** it does not pull attention away from nearby route-critical hazards or terrain

#### Scenario: Comparing blink to gameplay state
- **WHEN** the player reads the hover enemy threat during patrol
- **THEN** the enemy remains understandable without relying on the blink pattern
- **AND** no new gameplay timing or attack meaning is communicated only through that light accent



