## MODIFIED Requirements

### Requirement: Enemy palette-ramp variants and hit flashes stay presentation-only and readable
The game MAY present supported enemy visual variants through bounded palette-ramp treatment, Beam-assisted color ramps, or equivalent local post-processing that reads as a retro sprite-family swap rather than a plain tint multiplier. Under the chibi presentation contract, refreshed enemy sprites MAY add richer 16-bit-like internal detail and more expressive frame animation, but every enemy class MUST stay within its existing sprite canvas envelope and per-state frame budgets defined in `art.md`. Every supported enemy variant MUST preserve the same collision footprint, cadence, threat timing, and telegraph semantics as its base threat class. Variant presentation MUST stay within a small authored palette family, MUST preserve sprite-edge readability, and MUST NOT introduce gradient-heavy shading or dominant glow that overwhelms the enemy silhouette.

#### Scenario: Reading detailed chibi enemies in mixed encounters
- **WHEN** the player faces multiple enemy classes with refreshed detail and animation
- **THEN** each enemy remains readable as the same threat class through silhouette and telegraph timing
- **AND** added detail or extra frames do not hide nearby hazards or route cues

#### Scenario: Respecting enemy size and frame budgets
- **WHEN** enemy animation clips are expanded for richer motion
- **THEN** clip lengths remain within the min/max budget ranges in `art.md`
- **AND** enemy sprite envelopes remain unchanged from current runtime contracts

#### Scenario: Preserving threat fairness
- **WHEN** the enemy presentation refresh is evaluated in active gameplay
- **THEN** enemy collision and cadence remain unchanged from baseline
- **AND** all upgrades remain presentation-only
