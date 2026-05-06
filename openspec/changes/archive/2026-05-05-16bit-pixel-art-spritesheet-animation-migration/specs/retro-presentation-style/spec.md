## MODIFIED Requirements

### Requirement: Gameplay presentation uses an Atari 2600-inspired silhouette-first style
The game SHALL present active gameplay using a denser readable 8-bit console-inspired visual language defined by silhouette-first sprites and tiles, bounded palette ramps, flat fills with selective internal pixel detail, and restrained sprite-like motion rather than the earlier ultra-coarse silhouette-only pass. The presentation MUST move the player, enemies, terrain, and stage backdrops toward a more NES-like level of pixel complexity while preserving route readability, foreground versus background separation, and clear hazard contrast. When a stage defines authored backdrop palette inputs such as sky and ground colors, the active stage backdrop MUST derive its background bands, decorative motifs, and texture accents from those authored inputs or bounded derivatives of them, and it MUST keep those background colors and details visually secondary to playable terrain, hazards, and other foreground gameplay surfaces. Refreshed enemy designs for this pass MUST remain original to the project, MAY take style direction from supplied reference material, and MUST NOT directly copy or reproduce that reference image. Supported flying enemies MUST read as original symmetric underside-lit saucers or ovnis through lower-hull accent placement, readable belly-light separation, and bounded retro detailing rather than top-heavy cap accents or copied window details alone. Any optional hover-light blink used by those enemies MUST remain subtle, low-area, and visually secondary to silhouette and route readability. The refreshed backdrop language MUST evoke extraterrestrial or planetary spacescapes through original low-detail motifs such as distant planet disks, ring arcs, crater ridges, alien horizons, and sparse star fields, and it MUST not directly copy or reproduce the supplied background reference image. For this migration program, gameplay-facing sprite and animation key contracts MUST use `art.md` as the source of truth for key names, frame sizes, movement clip intent, and animator state mapping, and implementation MUST prioritize true frame animation over tint-only or tween-only substitutions.

#### Scenario: Viewing active gameplay
- **WHEN** the player enters a playable stage
- **THEN** the terrain, enemies, player-facing props, and backdrop motifs present denser 8-bit pixel detail than broad single-color slabs
- **AND** the presentation does not rely on smooth gradients or modern texture treatment to achieve that detail

#### Scenario: Reading foreground routes against the backdrop
- **WHEN** the player views platforms, hazards, or other traversable gameplay surfaces against the stage backdrop
- **THEN** the backdrop colors and motif detail remain visually secondary
- **AND** the background bands or decorative accents do not blend into the same color role as the playable route

#### Scenario: Comparing presentation intent to hardware emulation
- **WHEN** the updated gameplay presentation is evaluated against the change requirements
- **THEN** it reads as a denser 8-bit console-inspired style with clearer sprite and tile detail than the current coarse pass
- **AND** it does not require literal hardware-era emulation or exact console reproduction to satisfy the contract

#### Scenario: Tightening visuals without changing play behavior
- **WHEN** the denser 8-bit presentation pass is applied to active gameplay visuals
- **THEN** the visible presentation becomes richer in pixel detail and more sprite-and-tile-like
- **AND** player control timing, enemy cadence, and authored route behavior remain unchanged

#### Scenario: Presenting original planetary backdrops
- **WHEN** the game renders a stage backdrop after this change
- **THEN** the background reads as an original extraterrestrial spacescape rather than a generic abstract pattern
- **AND** it does not directly reproduce the supplied reference image

#### Scenario: Presenting refreshed enemy art in the same style family
- **WHEN** the player compares refreshed enemy designs during active play
- **THEN** the enemies read as original retro-styled sprites in the same visual family as the rest of the game
- **AND** the flying-enemy variants read through symmetric saucer silhouette, underside lighting, and lower-hull accents rather than copied reference details or top-heavy cap reads

#### Scenario: Reading optional hover-light polish
- **WHEN** a refreshed hover enemy uses a blink-light or shimmer accent during active play
- **THEN** the accent remains subtle and secondary to the enemy silhouette
- **AND** it does not become a distracting strobe or a required gameplay-state indicator

#### Scenario: Validating migration keys and movement mapping
- **WHEN** apply implementation wires gameplay sprite sheets and animation clips in this migration
- **THEN** key names, frame sizes, and movement-state mapping align with `art.md`
- **AND** deviations are treated as contract violations unless a follow-up spec change explicitly updates that source of truth

## ADDED Requirements

### Requirement: Slice-based sprite-sheet migration is apply-feasible and behavior-safe
The game SHALL execute 16-bit-like sprite-sheet migration in bounded implementation slices so each apply pass can be completed and validated without requiring a full-world art replacement in one change. The first slice MUST include gameplay player sprite-sheet animation plus route-critical world visuals for platform surface variants, gravity field/capsule visuals, spike hazards, reward and activation props, and exit or arrival support pieces listed in `art.md` immediate priorities. This slice MUST preserve existing collision behavior, simulation timing, and gameplay fairness while replacing procedural rectangle-driven visuals in the scoped scene touchpoints.

#### Scenario: Delivering the first migration slice
- **WHEN** the first sprite-sheet migration apply pass is completed
- **THEN** gameplay player uses true frame animation clips bound to runtime movement states
- **AND** scoped route-critical visuals are rendered from sprite or tile assets instead of rectangle-only primitives in the target render paths

#### Scenario: Avoiding false-positive migration completion
- **WHEN** migration completion is evaluated for the first slice
- **THEN** tint-only recolors and unbounded tween-heavy pseudo-animation do not count as satisfying sprite-sheet animation migration
- **AND** the pass must show true frame-based animation where animation is required by the slice contract

#### Scenario: Preserving fairness during visual migration
- **WHEN** the first slice updates rendering and animation presentation
- **THEN** movement constants, dash and jump timing windows, and enemy cadence remain unchanged
- **AND** collision or support behavior does not regress because of render-anchor or sprite-size drift
