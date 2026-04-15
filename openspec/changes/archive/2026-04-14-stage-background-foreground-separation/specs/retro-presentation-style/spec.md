## MODIFIED Requirements

### Requirement: Gameplay presentation uses an Atari 2600-inspired silhouette-first style
The game SHALL present active gameplay using an Atari 2600-inspired visual language defined by coarse blocky silhouettes, a very small concurrent color vocabulary, flat fills instead of shading-heavy rendering, sparse pose-based animation, and stronger shape contrast than texture detail. This style MUST be treated as creative inspiration rather than strict hardware emulation, so implementation MAY use modern rendering conveniences as long as the visible result preserves those traits. Under this second-pass tightening, active gameplay visuals MUST adopt harsher palette quantization and tighter sprite-like visual motion limits than the current baseline presentation while leaving gameplay behavior, simulation cadence, and authored stage content unchanged. When a stage defines authored backdrop palette inputs such as sky and ground colors, the active stage backdrop MUST derive its background bands and decorative backdrop accents from those authored inputs or bounded derivatives of them, and it MUST keep those background colors visually distinct from playable terrain, hazards, and other foreground gameplay surfaces.

#### Scenario: Viewing active gameplay
- **WHEN** the player enters a playable stage
- **THEN** the terrain, player-facing props, and other gameplay-rendered surfaces present a coarse, flat-fill silhouette-first style rather than smooth gradients or detail-heavy texture treatment

#### Scenario: Reading foreground routes against the backdrop
- **WHEN** the player views platforms, hazards, or other traversable gameplay surfaces against the stage backdrop
- **THEN** the backdrop colors remain visually secondary
- **AND** the background bands or decorative columns do not blend into the same color role as the playable route

#### Scenario: Comparing presentation intent to hardware emulation
- **WHEN** the updated gameplay presentation is evaluated against the change requirements
- **THEN** it reads as Atari 2600-inspired in shape, color restraint, and motion economy
- **AND** it does not require literal hardware-era sprite limits, artifact simulation, or exact console reproduction to satisfy the contract

#### Scenario: Tightening visuals without changing play behavior
- **WHEN** the second-pass palette and motion tightening is applied to active gameplay visuals
- **THEN** the visible presentation becomes more quantized and sprite-like
- **AND** player control timing, enemy cadence, and authored route behavior remain unchanged

### Requirement: Optional analog-display effects remain secondary to readability
Any optional scanline, CRT, flicker, or similar analog-display treatment used by this change SHALL remain subtle, SHALL never be required to communicate gameplay state, and SHALL preserve readability of the HUD, player state, hazards, and transition text. Any optional backdrop-only separation effect used to keep scenery distinct from the playable route MUST remain secondary to the authored stage palette, MUST NOT make the backdrop brighter or more attention-grabbing than the foreground, and MUST preserve the readability of HUD and transition overlays that sit above the stage view.

#### Scenario: Enabling an optional analog-style treatment
- **WHEN** the game renders with an optional scanline, CRT, or flicker-inspired treatment
- **THEN** that treatment remains visually secondary to gameplay information
- **AND** stage text, HUD values, and hazard telegraphs remain readable without depending on the effect

#### Scenario: Applying a subtle backdrop separation effect
- **WHEN** the stage presentation adds a backdrop-only effect to improve foreground separation
- **THEN** the effect does not become the primary focal point of the scene
- **AND** player powers, hazards, HUD text, and transition text remain readable over the updated background