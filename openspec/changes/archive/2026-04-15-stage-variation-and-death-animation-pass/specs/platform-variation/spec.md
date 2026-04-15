## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, timed-reveal secret routes, and activation-node magnetic-platform routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one authored terrain-surface traversal section and at least one bounded gravity-field traversal section, and at least one of those sections MUST open an elevated route, alternate line, or hidden secret connector branch by combining that terrain or gravity mechanic with existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, scanner-switch temporary-bridge, timed-reveal, or activation-node magnetic-platform behavior. This rollout MUST extend across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array rather than staying centered on the Halo Spire Array sky section alone. Verdant Impact Crater MUST use its terrain or gravity section to support a readable ridge, canopy, or beacon-approach connector. Ember Rift Warrens MUST use its terrain or gravity section to shape a pressure route through a denser hazard or enemy band with a readable recovery or alternate line. Halo Spire Array MUST continue to use high-air gravity routing while also pairing that routing with terrain-surface footing or recovery variation. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. Any activation-node magnetic-platform route used for this purpose MUST link a nearby authored activation node to a visibly present magnetic platform, MUST provide support only while powered, and MUST preserve a safe main-route fallback or other bounded recovery path when the route is skipped or later reset. These high-air, hidden, timed, launcher-assisted, terrain-shaped, gravity-field, or powered-support routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, attraction or repulsion forces, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing the campaign gravity-field rollout
- **WHEN** the player reaches the primary gravity-field traversal section in Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array
- **THEN** that route reads as a bounded stage-authored variation specific to that stage rather than a reused global gravity rewrite

#### Scenario: Reading an activation-node magnetic route
- **WHEN** the player reaches an authored route that pairs a nearby activation node with a magnetic platform
- **THEN** the node and platform read as one bounded powered-support mechanic rather than a generalized puzzle system

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct terrain, gravity, and route-shape behavior rather than only palette changes or the same mechanic pairing