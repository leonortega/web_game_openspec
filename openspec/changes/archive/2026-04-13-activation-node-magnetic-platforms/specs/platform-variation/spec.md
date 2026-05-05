## ADDED Requirements

### Requirement: Activation nodes power magnetic platforms with bounded support rules
The game SHALL support authored activation nodes that power linked magnetic platforms as a binary traversal mechanic. Every magnetic platform MUST begin unpowered and non-solid on a fresh attempt, MUST remain visibly present with a readable dormant presentation before activation, and MUST become powered, visibly active, and solid on the same update in which the player triggers its linked activation node. A powered magnetic platform MUST act only as floor-like top-surface support for grounded traversal and jump initiation, and MUST NOT add wall cling, ceiling traversal, attraction or repulsion forces, generalized node graphs, or polarity-specific runtime branching. Activation MUST use one nearby authored activation-node pattern linked explicitly to the platform route and MUST NOT require a new HUD panel, interact button, or projectile-only gating.

#### Scenario: Activating a magnetic platform
- **WHEN** the player triggers the authored activation node linked to a dormant magnetic platform
- **THEN** the linked platform becomes visibly powered and solid on that same update

#### Scenario: Reading an unpowered magnetic platform
- **WHEN** the player reaches a route that includes a dormant magnetic platform before triggering its linked node
- **THEN** the platform remains visible but clearly reads as non-supporting until activation

#### Scenario: Traversing a powered magnetic platform
- **WHEN** the player lands on a powered magnetic platform from above
- **THEN** the platform provides normal floor-like top-surface support and jump initiation without enabling wall or ceiling traversal

## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, timed-reveal secret routes, and activation-node magnetic-platform routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route, alternate line, or hidden secret connector branch by using existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, scanner-switch temporary-bridge, timed-reveal, activation-node magnetic-platform, or terrain-surface behaviors. Gravity inversion columns and anti-grav streams MAY be used for this purpose only as bounded authored rectangular field routes, and their primary authored rollout MUST stay centered on the Halo Spire Array sky section rather than broadening into uniform multi-stage use. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. Any activation-node magnetic-platform route used for this purpose MUST link a nearby authored activation node to a visibly present magnetic platform, MUST provide support only while powered, and MUST preserve a safe main-route fallback or other bounded recovery path when the route is skipped or later reset. These high-air, hidden, timed, launcher-assisted, terrain-shaped, gravity-field, or powered-support routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, attraction or repulsion forces, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Reading an activation-node magnetic route
- **WHEN** the player reaches an authored route that pairs a nearby activation node with a magnetic platform
- **THEN** the node and platform read as one bounded powered-support mechanic rather than a generalized puzzle system

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes