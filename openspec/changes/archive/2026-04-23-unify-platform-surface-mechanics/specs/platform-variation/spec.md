## ADDED Requirements

### Requirement: Static platform surface mechanics share one platform-owned source of truth
The game SHALL author `brittleCrystal`, `stickySludge`, `bouncePod`, and `gasVent` as platform-owned surface mechanics on supported static platforms unless a later change explicitly broadens that support. These mechanics MUST NOT be authored as partial overlays, free-floating rectangles, separate launcher annotations, terrain-surface collections, or default combinations on moving, unstable, lift-style, spring, or other non-static platform kinds in this contract. Validation, runtime ingestion, rendering, and route references MUST treat the authored static platform record and its platform-owned surface-mechanic field as the only source of truth for these mechanics.

#### Scenario: Authoring a valid static platform surface mechanic
- **WHEN** stage data marks a supported static platform as `brittleCrystal`, `stickySludge`, `bouncePod`, or `gasVent`
- **THEN** the full authored platform footprint uses that mechanic for validation, runtime, and rendering

#### Scenario: Authoring a legacy overlay or launcher-owned surface mechanic
- **WHEN** stage data attempts to define any of those four mechanics through a terrain overlay rectangle, terrain-surface record, separate launcher annotation, or other non-platform-owned shape
- **THEN** that authored data is rejected before runtime use

#### Scenario: Authoring a dynamic platform surface mechanic
- **WHEN** stage data attempts to place any of those four mechanics on a moving, unstable, lift-style, spring, or other non-static platform
- **THEN** validation rejects that authored data unless another explicit capability has broadened support

### Requirement: Current main stages use live platform-authored bounce and gas rollout
The game SHALL use authored full-platform static-platform `bouncePod` and `gasVent` beats as live traversal surfaces in the shipped main campaign instead of confining those mechanics to separate launcher collections or fixture-only coverage. Across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, the shipped rollout MUST include at least one live platform-authored `bouncePod` beat and at least one live platform-authored `gasVent` beat, and those two launch-surface kinds MUST appear across at least two different stages in that set. These beats MUST use readable current-route geometry or a readable nearby branch, MUST keep bounce-pod and gas-vent semantics distinct from springs, and MUST read as authored platform surfaces rather than narrow launcher overlays.

#### Scenario: Entering a live platform-authored bounce or gas beat
- **WHEN** the player reaches a current shipped main-stage platform authored as `bouncePod` or `gasVent`
- **THEN** the full static-platform footprint reads and behaves as that surface mechanic rather than as plain support or a narrower launcher patch

#### Scenario: Comparing bounce and gas rollout across stages
- **WHEN** the player compares Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array
- **THEN** the current shipped rollout includes at least one live platform-authored `bouncePod` beat and at least one live platform-authored `gasVent` beat
- **AND** those launch-surface beats are distributed across at least two of those stages

## MODIFIED Requirements

### Requirement: Traversal platforms can modify jump flow
The game SHALL support special traversal surfaces such as spring platforms, bounce pods, gas vents, or lift-style platforms that alter player movement in intentional ways. Spring platforms MUST behave as full-platform traversal surfaces that apply their existing vertical spring boost across the full authored platform footprint. Bounce pods and gas vents MUST behave as full-platform static-platform surface mechanics that trigger on the first eligible top-surface contact while ready and apply a single launch impulse rather than continuous lift. A bounce-pod or gas-vent surface that fires MUST consume readiness, MUST enter cooldown immediately, and MUST NOT retrigger while the same uninterrupted contact continues. Bounce pods MUST launch the player higher than gas vents under otherwise identical conditions and MUST recover readiness sooner than gas vents. Both launch-surface kinds MAY use an authored directional bias, but that direction MUST remain upward-biased and MUST stay within 25 degrees of straight up. Bounce pods and gas vents MUST remain distinct from spring platforms, anti-grav streams, gravity zones, and other continuous lift mechanics in authored data, runtime behavior, and presentation. Where a current shipped beat uses bounce-pod or gas-vent behavior on support footing, that beat MUST use platform-owned static-platform authoring rather than a separate launcher annotation or a spring substitution.

#### Scenario: Using a spring platform
- **WHEN** the player lands on an authored spring platform from above
- **THEN** the full platform footprint provides the spring platform's existing vertical boost behavior

#### Scenario: Using a platform-authored bounce pod
- **WHEN** the player gains eligible top-surface contact with a ready static platform authored as `bouncePod`
- **THEN** the full platform footprint launches the player immediately with a single higher impulse and enters cooldown

#### Scenario: Using a platform-authored gas vent
- **WHEN** the player gains eligible top-surface contact with a ready static platform authored as `gasVent`
- **THEN** the full platform footprint launches the player immediately with a single lower impulse than a bounce pod and enters cooldown

#### Scenario: Using a directionally biased platform-authored launch surface
- **WHEN** the player triggers a platform-authored `bouncePod` or `gasVent` with a valid authored launch direction
- **THEN** the launch follows that upward-biased direction instead of only a straight vertical impulse

#### Scenario: Reading a shipped platform-authored launch beat
- **WHEN** the player reaches a current shipped static-support beat that uses bounce-pod or gas-vent behavior
- **THEN** that beat reads and behaves as one bounded full-footprint platform surface rather than as a narrower launcher overlay or a spring replacement

#### Scenario: Using a lift platform
- **WHEN** the player rides a lift or vertically moving platform
- **THEN** it carries the player along its authored route without breaking traversal readability

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, timed-reveal secret routes, activation-node magnetic-platform routes, and bounded gravity-field traversal to strengthen each stage's alien-biome identity rather than applying the same traversal gimmick uniformly everywhere. Each main stage MUST include at least one bounded gravity-field traversal section and at least one additional authored traversal-variation section built from moving, unstable, lift-style, spring-platform, platform-authored bounce-pod, platform-authored gas-vent, reveal-platform, scanner-switch temporary-bridge, timed-reveal, activation-node magnetic-platform, or other supported route-shaping behavior, and at least one of those sections MUST open an elevated route, alternate line, or hidden secret connector branch by combining gravity or route-shaping mechanics with existing supported traversal behavior. This rollout MUST extend across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array rather than staying centered on the Halo Spire Array sky section alone. Verdant Impact Crater MUST use its gravity or traversal-variation section to support a readable ridge, canopy, or beacon-approach connector. Ember Rift Warrens MUST use its gravity or traversal-variation section to shape a pressure route through a denser hazard or enemy band with a readable recovery or alternate line. Halo Spire Array MUST continue to use high-air gravity routing while also pairing that routing with a readable recovery variation, alternate connector, or other bounded route-shaping beat. Current main-stage plain green-top platforms in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST behave as ordinary static support unless they are visibly authored as another supported traversal modifier, and those stages MUST NOT hide `brittleCrystal` or `stickySludge` terrain behavior underneath unchanged normal-platform presentation. Any current main-stage assisted-launch beat that sits on static support MUST read as a platform-authored bounce-pod or gas-vent surface rather than as a narrower launcher-assisted overlay or a spring substitution. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. Any activation-node magnetic-platform route used for this purpose MUST link a nearby authored activation node to a visibly present magnetic platform, MUST provide support only while powered, and MUST preserve a safe main-route fallback or other bounded recovery path when the route is skipped or later reset. These high-air, hidden, timed, spring-assisted, platform-authored launch-surface, gravity-field, or powered-support routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, attraction or repulsion forces, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the platform behavior, gravity-field use, and route layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing the campaign gravity-field rollout
- **WHEN** the player reaches the primary gravity-field traversal section in Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array
- **THEN** that route reads as a bounded stage-authored variation specific to that stage rather than a reused global gravity rewrite

#### Scenario: Reading plain green support in a current main stage
- **WHEN** the player reaches a plain green-top platform on the intended route in Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array
- **THEN** that platform behaves as ordinary support unless its authored presentation clearly marks another supported traversal modifier
- **AND** it does not hide brittle crystal or sticky sludge behavior under normal-platform visuals

#### Scenario: Reading a platform-authored assisted-launch beat
- **WHEN** the player reaches a current main-stage beat that uses platform-authored `bouncePod` or `gasVent` behavior on static support
- **THEN** the full support footprint reads as one bounded platform surface beat rather than as a floating or narrower launcher reskin

#### Scenario: Reading an activation-node magnetic route
- **WHEN** the player reaches an authored route that pairs a nearby activation node with a magnetic platform
- **THEN** the node and platform read as one bounded powered-support mechanic rather than a generalized puzzle system

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal, gravity, and route-shape behavior rather than only palette changes or the same mechanic pairing