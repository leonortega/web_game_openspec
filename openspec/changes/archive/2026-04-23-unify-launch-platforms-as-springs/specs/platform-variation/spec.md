## MODIFIED Requirements

### Requirement: Static platform surface mechanics share one platform-owned source of truth
The game SHALL author `brittleCrystal` and `stickySludge` as platform-owned surface mechanics on supported static platforms unless a later change explicitly broadens that support. These mechanics MUST NOT be authored as partial overlays, free-floating rectangles, separate launcher annotations, terrain-surface collections, or default combinations on moving, unstable, lift-style, spring, or other non-static platform kinds in this contract. Spring platforms MUST be authored as traversal-platform kinds rather than through the static-platform surface-mechanic field. Validation, runtime ingestion, rendering, and route references MUST treat the authored static platform record and its platform-owned surface-mechanic field as the only source of truth for `brittleCrystal` and `stickySludge`.

#### Scenario: Authoring a valid static platform surface mechanic
- **WHEN** stage data marks a supported static platform as `brittleCrystal` or `stickySludge`
- **THEN** the full authored platform footprint uses that mechanic for validation, runtime, and rendering

#### Scenario: Authoring a retired bounce or gas surface mechanic
- **WHEN** stage data attempts to define `bouncePod` or `gasVent` through a platform surface-mechanic value, launcher annotation, terrain-surface record, or other non-platform-owned shape
- **THEN** that authored data is rejected before runtime use

#### Scenario: Authoring a dynamic platform surface mechanic
- **WHEN** stage data attempts to place `brittleCrystal` or `stickySludge` on a moving, unstable, lift-style, spring, or other non-static platform
- **THEN** validation rejects that authored data unless another explicit capability has broadened support

### Requirement: Traversal platforms can modify jump flow
The game SHALL support special traversal surfaces such as spring platforms or lift-style platforms that alter player movement in intentional ways. Spring platforms MUST behave as full-platform traversal surfaces that apply their existing vertical spring boost across the full authored platform footprint. Spring platforms MUST remain distinct from anti-grav streams, gravity zones, and other continuous lift mechanics in authored data, runtime behavior, and presentation. Current playable stages MUST author every green contact-launch surface in this family as a spring platform rather than as `bouncePod`, `gasVent`, launcher metadata, or a tiny spring patch laid over unchanged support.

#### Scenario: Using a spring platform
- **WHEN** the player lands on an authored spring platform from above
- **THEN** the full platform footprint provides the spring platform's existing vertical boost behavior

#### Scenario: Reading a converted former bounce or gas beat
- **WHEN** the player reaches a current route beat that formerly used `bouncePod` or `gasVent` behavior
- **THEN** that beat now reads and behaves as one bounded full-footprint spring-platform beat or another supported platform-variation beat
- **AND** it does not rely on a narrower launcher overlay or a token spring patch on plain support

#### Scenario: Using a lift platform
- **WHEN** the player rides a lift or vertically moving platform
- **THEN** it carries the player along its authored route without breaking traversal readability

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, timed-reveal secret routes, activation-node magnetic-platform routes, and bounded gravity-field traversal to strengthen each stage's alien-biome identity rather than applying the same traversal gimmick uniformly everywhere. Each main stage MUST include at least one bounded gravity-field traversal section and at least one additional authored traversal-variation section built from moving, unstable, lift-style, spring-platform, reveal-platform, scanner-switch temporary-bridge, timed-reveal, activation-node magnetic-platform, or other supported route-shaping behavior, and at least one of those sections MUST open an elevated route, alternate line, or hidden secret connector branch by combining gravity or route-shaping mechanics with existing supported traversal behavior. This rollout MUST extend across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array rather than staying centered on the Halo Spire Array sky section alone. Verdant Impact Crater MUST use its gravity or traversal-variation section to support a readable ridge, canopy, or beacon-approach connector. Ember Rift Warrens MUST use its gravity or traversal-variation section to shape a pressure route through a denser hazard or enemy band with a readable recovery or alternate line. Halo Spire Array MUST continue to use high-air gravity routing while also pairing that routing with a readable recovery variation, alternate connector, or other bounded route-shaping beat. Current main-stage plain green-top platforms in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST behave as ordinary static support unless they are visibly authored as another supported traversal modifier, and those stages MUST NOT hide `brittleCrystal` or `stickySludge` terrain behavior underneath unchanged normal-platform presentation. Any current main-stage beat converted away from `bouncePod` or `gasVent` MUST become a full-footprint spring platform or another supported traversal-variation beat rather than a narrow overlay or unchanged plain support stand-in. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. Any activation-node magnetic-platform route used for this purpose MUST link a nearby authored activation node to a visibly present magnetic platform, MUST provide support only while powered, and MUST preserve a safe main-route fallback or other bounded recovery path when the route is skipped or later reset. These high-air, hidden, timed, spring-assisted, gravity-field, or powered-support routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, attraction or repulsion forces, or presentation-only fake platforms.

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

#### Scenario: Reading a converted launch-platform beat
- **WHEN** the player reaches a current main-stage beat converted away from `bouncePod` or `gasVent`
- **THEN** the replacement reads as one bounded spring-platform or other supported variation beat rather than as a floating reskin or unchanged plain support

#### Scenario: Reading an activation-node magnetic route
- **WHEN** the player reaches an authored route that pairs a nearby activation node with a magnetic platform
- **THEN** the node and platform read as one bounded powered-support mechanic rather than a generalized puzzle system

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal, gravity, and route-shape behavior rather than only palette changes or the same mechanic pairing

## ADDED Requirements

### Requirement: Current main stages use live spring-platform rollout with less static filler
The game SHALL use authored full-footprint spring-platform beats as the only shipped launch-platform family in the current main campaign. Across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, the shipped rollout MUST include at least one live spring-platform beat in at least two of those stages, and each of those three stages MUST include at least one readable non-gravity traversal-variation section beyond ordinary static support. Converted former `bouncePod` or `gasVent` beats MUST use readable current-route geometry or a readable nearby branch, MUST read as authored spring or other supported platform variation, and MUST NOT collapse into unchanged plain support or a tiny spring strip laid over plain support.

#### Scenario: Entering a live spring-platform beat
- **WHEN** the player reaches a current shipped main-stage spring platform
- **THEN** the full platform footprint reads and behaves as a spring beat rather than as plain support or a narrower hidden trigger patch

#### Scenario: Comparing spring rollout across stages
- **WHEN** the player compares Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array
- **THEN** the current shipped rollout includes live spring-platform beats across at least two of those stages
- **AND** all three stages include readable non-gravity traversal variation beyond ordinary static support

#### Scenario: Auditing a converted support-platform launch beat
- **WHEN** validation or authored-stage analysis audits a current shipped beat converted away from `bouncePod` or `gasVent`
- **THEN** that beat is implemented as a full-footprint spring platform or another supported variation beat
- **AND** it is not implemented as unchanged plain support or a token spring overlay

## REMOVED Requirements

### Requirement: Current main stages use live platform-authored bounce and gas rollout
**Reason**: `bouncePod` and `gasVent` are retired so spring platforms become the only shipped launch-platform family.
**Migration**: Convert those beats to full-footprint spring platforms or other supported platform-variation beats, and remove bounce/gas references from authoring, rendering, audio, and tests.