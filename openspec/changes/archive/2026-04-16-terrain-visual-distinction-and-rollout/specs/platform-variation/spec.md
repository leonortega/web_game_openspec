## ADDED Requirements

### Requirement: Existing special terrain surfaces remain visually distinct in play
The game SHALL present authored `brittleCrystal` and `stickySludge` surfaces with distinct readable cues that communicate their terrain identity beyond color difference alone. A brittle crystal surface MUST read as crystalline and fragile while intact, MUST intensify a visible warning cue during its break countdown, and MUST read as broken and non-supporting after collapse. A sticky sludge surface MUST read as viscous and drag-inducing while traversable, using a layered or subtly animated surface cue that remains legible during normal movement. These cues MUST stay bounded to the authored terrain rectangle and MUST remain consistent across retries.

#### Scenario: Reading brittle crystal before first contact
- **WHEN** the player approaches an intact brittle crystal surface
- **THEN** the surface already reads as a distinct crystalline traversal hazard rather than normal ground or sticky sludge

#### Scenario: Reading a brittle warning state
- **WHEN** the player triggers a brittle crystal surface and its warning window begins
- **THEN** the warning presentation becomes visibly stronger before the floor breaks

#### Scenario: Reading sticky sludge in motion
- **WHEN** the player crosses a sticky sludge surface at normal gameplay speed
- **THEN** the surface remains visually distinguishable as sticky traversal even while the player is moving across it

### Requirement: Main stages broaden authored brittle and sticky terrain rollout
The game SHALL broaden authored `brittleCrystal` and `stickySludge` placement across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array instead of limiting each main stage to a single placement of each kind. Each current main stage MUST include at least two authored brittle crystal surfaces and at least two authored sticky sludge surfaces, and those authored surfaces MUST span at least two distinct traversal beats on the intended route or an optional reconnecting branch. This rollout MUST remain biome-specific and stage-authored rather than applying a uniform repeating pattern, and it MUST stay limited to these two existing special terrain kinds.

#### Scenario: Loading a main stage with broadened brittle and sticky rollout
- **WHEN** a current main stage is loaded for runtime use
- **THEN** its authored data includes at least two brittle crystal surfaces and at least two sticky sludge surfaces

#### Scenario: Progressing through multiple terrain beats in one stage
- **WHEN** the player advances through a current main stage
- **THEN** they encounter brittle or sticky terrain in more than one authored traversal beat instead of only one isolated sample section

#### Scenario: Comparing terrain rollout across stages
- **WHEN** the player compares the special terrain sections in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array
- **THEN** each stage uses the broadened brittle and sticky rollout in a biome-specific way rather than repeating one uniform pattern