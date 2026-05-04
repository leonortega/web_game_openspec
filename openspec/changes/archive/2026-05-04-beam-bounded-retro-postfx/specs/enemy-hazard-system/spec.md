## ADDED Requirements

### Requirement: Enemy palette-ramp variants and hit flashes stay presentation-only and readable
The game MAY present supported enemy visual variants through bounded palette-ramp treatment, Beam-assisted color ramps, or equivalent local post-processing that reads as a retro sprite-family swap rather than a plain tint multiplier. Every supported enemy variant MUST preserve the same collision footprint, cadence, threat timing, and telegraph semantics as its base threat class. Variant presentation MUST stay within a small authored palette family, MUST preserve sprite-edge readability, and MUST NOT introduce gradient-heavy shading or dominant glow that overwhelms the enemy silhouette. Supported enemy damage or defeat feedback MAY also trigger a short object-local hit flash, but that flash MUST remain brief, MUST stay attached to the enemy body, and MUST NOT hide active telegraphs, projectile colors, or nearby route-critical hazards.

#### Scenario: Reading two enemy color variants in play
- **WHEN** the player encounters two supported variants of the same enemy class in different authored colors
- **THEN** each variant reads as the same threat class with a bounded palette-family change rather than a different mechanic
- **AND** the underlying movement, telegraph, and collision behavior remain unchanged

#### Scenario: Reading an enemy hit flash
- **WHEN** a supported enemy takes damage or defeat feedback triggers a local flash
- **THEN** the flash stays short and local to that enemy body
- **AND** the enemy's remaining telegraph or defeat state stays readable during the effect

#### Scenario: Rejecting dominant enemy postfx styling
- **WHEN** the updated enemy presentation is evaluated in a busy encounter
- **THEN** the palette-ramp treatment remains secondary to the enemy silhouette and route readability
- **AND** it does not become a blur-heavy, bloom-heavy, or full-screen shader spectacle