## MODIFIED Requirements

### Requirement: Traversal platforms can modify jump flow
The game SHALL support special traversal surfaces such as bounce pods, gas vents, or lift-style platforms that alter player movement in intentional ways. Bounce pods and gas vents MUST behave as authored contact launchers that trigger on the first eligible top-surface contact while ready and apply a single launch impulse rather than continuous lift. A launcher that fires MUST consume readiness, MUST enter cooldown immediately, and MUST NOT retrigger while the same uninterrupted contact continues. Bounce pods MUST launch the player higher than gas vents under otherwise identical conditions and MUST recover readiness sooner than gas vents. Both launcher kinds MAY use an authored directional bias, but that direction MUST remain upward-biased and MUST stay within 25 degrees of straight up. Bounce pods and gas vents MUST remain distinct from anti-grav streams, gravity zones, and other continuous lift mechanics in authored data, runtime behavior, and presentation. Current playable stages MUST author green contact-launch surfaces in this family as bounce pods rather than as a separate spring-platform mechanic.

#### Scenario: Using a bounce pod
- **WHEN** the player gains eligible top-surface contact with a ready bounce pod
- **THEN** the bounce pod launches the player immediately with a single higher impulse and enters cooldown

#### Scenario: Using a gas vent
- **WHEN** the player gains eligible top-surface contact with a ready gas vent
- **THEN** the gas vent launches the player immediately with a single lower impulse than a bounce pod and enters cooldown

#### Scenario: Using a directionally biased launcher
- **WHEN** the player triggers a bounce pod or gas vent with a valid authored launch direction
- **THEN** the launch follows that upward-biased direction instead of only a straight vertical impulse

#### Scenario: Reusing a launcher after recovery
- **WHEN** the player leaves a launcher and later re-contacts it after its cooldown has elapsed
- **THEN** the launcher can fire again from that new contact event

#### Scenario: Using a converted former spring beat
- **WHEN** the player reaches a current stage route that formerly used a spring platform
- **THEN** that route now uses bounce-pod launch behavior with readable support footing on the same beat

#### Scenario: Using a lift platform
- **WHEN** the player rides a lift or vertically moving platform
- **THEN** it carries the player along its authored route without breaking traversal readability

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, timed-reveal secret routes, activation-node magnetic-platform routes, and bounded gravity-field traversal to strengthen each stage's alien-biome identity rather than applying the same traversal gimmick uniformly everywhere. Each main stage MUST include at least one bounded gravity-field traversal section and at least one additional authored traversal-variation section built from moving, unstable, lift-style, bounce-pod, gas-vent, reveal-platform, scanner-switch temporary-bridge, timed-reveal, activation-node magnetic-platform, or other supported route-shaping behavior, and at least one of those sections MUST open an elevated route, alternate line, or hidden secret connector branch by combining gravity or route-shaping mechanics with existing supported traversal behavior. This rollout MUST extend across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array rather than staying centered on the Halo Spire Array sky section alone. Verdant Impact Crater MUST use its gravity or traversal-variation section to support a readable ridge, canopy, or beacon-approach connector. Ember Rift Warrens MUST use its gravity or traversal-variation section to shape a pressure route through a denser hazard or enemy band with a readable recovery or alternate line. Halo Spire Array MUST continue to use high-air gravity routing while also pairing that routing with a readable recovery variation, alternate connector, or other bounded route-shaping beat. Current main-stage plain green-top platforms in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST behave as ordinary static support unless they are visibly authored as another supported traversal modifier, and those stages MUST NOT hide `brittleCrystal` or `stickySludge` terrain behavior underneath unchanged normal-platform presentation. Any converted former spring beat in those stages MUST keep a readable support surface plus bounce-pod launcher composition rather than collapsing into unsupported presentation-only launch art. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. Any activation-node magnetic-platform route used for this purpose MUST link a nearby authored activation node to a visibly present magnetic platform, MUST provide support only while powered, and MUST preserve a safe main-route fallback or other bounded recovery path when the route is skipped or later reset. These high-air, hidden, timed, launcher-assisted, gravity-field, or powered-support routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, attraction or repulsion forces, or presentation-only fake platforms.

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

#### Scenario: Reading a converted launcher beat
- **WHEN** the player reaches a current route beat that replaced a spring with a bounce pod
- **THEN** the bounce pod and its support footing read as one bounded launcher-assisted traversal beat rather than as a floating reskin

#### Scenario: Reading an activation-node magnetic route
- **WHEN** the player reaches an authored route that pairs a nearby activation node with a magnetic platform
- **THEN** the node and platform read as one bounded powered-support mechanic rather than a generalized puzzle system

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal, gravity, and route-shape behavior rather than only palette changes or the same mechanic pairing