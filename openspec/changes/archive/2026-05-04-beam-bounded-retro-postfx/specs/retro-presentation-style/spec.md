## ADDED Requirements

### Requirement: Bounded Beam and post-processing accents stay local and presentation-only
The game MAY use Phaser 4 Beam, shader, or post-processing accents to support enemy palette-ramp variants, object-local hit flashes, and localized water or heat shimmer as classic 16-bit presentation tricks. Any such effect MUST remain palette-bounded, spatially local, and visually secondary to silhouettes, hazards, terrain edges, and route telegraphs. These effects MUST layer on top of the existing sprite-first presentation rather than replace core sprite art with a shader-first rendering style, MUST route through bounded world-space or object-local regions rather than a whole-camera warp, and MUST fully preserve existing gameplay timing and simulation behavior. Localized water or heat shimmer in this contract MUST remain presentation-only, MUST stay attached to safe scenery or non-mechanical surfaces, and MUST NOT invent new hazard or traversal rules.

#### Scenario: Reading a palette-ramp enemy variant
- **WHEN** the player views supported enemy color variants during active play
- **THEN** those variants read as bounded retro palette swaps or ramp changes rather than as plain tint-only recolors
- **AND** the enemy silhouette and telegraph remain clearer than the effect treatment itself

#### Scenario: Reading a local hit flash during combat
- **WHEN** the player or a supported enemy takes a hit that triggers local flash feedback
- **THEN** the flash remains attached to that object and resolves quickly enough that nearby route-critical information stays readable
- **AND** the effect does not expand into a camera-wide or HUD-wide flash

#### Scenario: Reading decorative water or heat shimmer
- **WHEN** an authored safe scenery patch or non-mechanical surface uses localized water or heat distortion
- **THEN** the shimmer remains tightly local to that patch and visually secondary to playable terrain and hazards
- **AND** the player does not need the shimmer to infer a new mechanic or route rule

#### Scenario: Comparing retro accents to modern spectacle
- **WHEN** the updated Beam or shader accents are evaluated during gameplay
- **THEN** they still read as restrained retro presentation support
- **AND** they do not rely on dominant blur, bloom, or full-scene distortion

## MODIFIED Requirements

### Requirement: Optional analog-display effects remain secondary to readability
Any optional scanline, CRT, flicker, or similar analog-display treatment used by this change SHALL remain subtle, SHALL never be required to communicate gameplay state, and SHALL preserve readability of the HUD, player state, hazards, and transition text. Any optional backdrop-only separation effect used to keep scenery distinct from the playable route MUST remain secondary to the authored stage palette, MUST NOT make the backdrop brighter or more attention-grabbing than the foreground, and MUST preserve the readability of HUD and transition overlays that sit above the stage view. Any bounded Beam, distortion, or similar postfx region added by this change MUST stay within world-local presentation space and MUST NOT warp the gameplay HUD band, transient message lane, or other overlay text. Planetary or extraterrestrial backdrop motifs MUST also stay low-density enough that readable paths, hazard telegraphs, and power silhouettes remain more visually dominant than the scenery.

#### Scenario: Enabling an optional analog-style treatment
- **WHEN** the game renders with an optional scanline, CRT, or flicker-inspired treatment
- **THEN** that treatment remains visually secondary to gameplay information
- **AND** stage text, HUD values, and hazard telegraphs remain readable without depending on the effect

#### Scenario: Applying a subtle backdrop separation effect
- **WHEN** the stage presentation adds a backdrop-only effect to improve foreground separation
- **THEN** the effect does not become the primary focal point of the scene
- **AND** player powers, hazards, HUD text, and transition text remain readable over the updated background

#### Scenario: Excluding the HUD from local distortion
- **WHEN** world-local Beam or distortion accents are active in the stage view
- **THEN** the top HUD band, transient message lane, and other overlay text remain unwarped and readable
- **AND** only the intended world-local presentation region carries the effect