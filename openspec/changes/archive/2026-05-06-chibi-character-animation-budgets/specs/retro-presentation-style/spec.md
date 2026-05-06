## MODIFIED Requirements

### Requirement: Gameplay presentation uses an Atari 2600-inspired silhouette-first style
The game SHALL present active gameplay using a denser readable 8-bit/16-bit-inspired visual language defined by silhouette-first sprites and tiles, bounded palette ramps, flat fills with selective internal pixel detail, and restrained sprite-like motion rather than coarse silhouette-only rendering. For gameplay-facing actors, this pass MUST support a chibi-oriented character language for the player and grounded/hover enemies: readable oversized head mass, compact torso-limb masses, and clear pose readability at 1x scale. Higher detail is allowed and encouraged, but MUST remain bounded by explicit sprite canvas and frame budgets from `art.md` so the animation scope stays apply-feasible. This presentation uplift MUST remain behavior-safe and MUST NOT change collision semantics, movement constants, enemy cadence, or authored route fairness.

#### Scenario: Reading chibi actor silhouettes during active play
- **WHEN** the player views the player avatar and enemy cast in active gameplay
- **THEN** each actor reads as a compact chibi-like character with clear silhouette separation at gameplay scale
- **AND** added detail does not reduce route readability or hazard contrast

#### Scenario: Increasing detail without unbounded scope
- **WHEN** artists add richer internal pixel detail and extra animation frames for character states
- **THEN** the resulting assets stay within the canvas and frame limits defined in `art.md`
- **AND** migration remains feasible without requiring a full-world art replacement in one pass

#### Scenario: Preserving behavior while upgrading character presentation
- **WHEN** chibi-oriented detail and animation upgrades are applied
- **THEN** collision footprints, movement timing, and enemy threat cadence remain unchanged
- **AND** the change remains presentation-only
