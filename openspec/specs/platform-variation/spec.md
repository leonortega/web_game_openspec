# platform-variation Specification

## Purpose
Define dynamic terrain and platform behaviors that expand traversal variety while preserving readable platformer rules.
## Requirements
### Requirement: Stages support dynamic platform behaviors
The game SHALL support authored platform behaviors beyond static ground so stages can introduce movement-based traversal challenges. Dynamic traversal support MUST include moving platforms, unstable or collapsing support, and authored terrain-surface modifiers such as brittle crystal floors and sticky sludge surfaces. Each supported behavior MUST follow predictable rules that players can learn through repetition.

#### Scenario: Encountering a moving platform
- **WHEN** the player reaches a section with a moving platform
- **THEN** the platform follows its authored path and timing consistently

#### Scenario: Repeating a traversal section
- **WHEN** the player retries the same dynamic platform section
- **THEN** the platform or surface behavior remains readable and consistent with prior attempts

#### Scenario: Entering a brittle crystal section
- **WHEN** the player first steps onto an authored brittle crystal floor from above
- **THEN** that floor begins its readable warning state using the authored brittle-surface rules

#### Scenario: Entering a sticky sludge section
- **WHEN** the player moves across an authored sticky sludge surface
- **THEN** the traversal section uses the authored sticky-surface movement rules consistently across retries

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal floors that behave as one-shot delayed-collapse top surfaces. A falling platform MUST continue to act as valid support for grounded movement and jump initiation while the player still has top-surface contact with it. A brittle crystal floor MUST start its warning countdown only after first top-surface contact, MUST remain fully solid during that warning window, and MUST become broken and non-supporting after the warning delay unless the player is still using its top surface for support at the instant of expiry. If the warning delay expires while the player still has top-surface support contact, the brittle floor MUST remain valid support only until that support contact ends and MUST then break immediately.

#### Scenario: Standing on a collapsing platform
- **WHEN** the player lands on an unstable platform
- **THEN** the platform gives a short readable warning before dropping or failing

#### Scenario: Leaving a collapsing platform early
- **WHEN** the player exits the unstable platform before it fails
- **THEN** the player can continue traversal if they moved in time

#### Scenario: Jumping during platform descent
- **WHEN** the platform has started falling but the player is still standing on its top surface
- **THEN** the player can still jump normally from that platform

#### Scenario: Triggering a brittle crystal floor
- **WHEN** the player lands on a brittle crystal floor's top surface for the first time in the current attempt
- **THEN** the floor shows a readable warning and remains usable during its short delay

#### Scenario: Escaping a brittle crystal floor at expiry
- **WHEN** a brittle crystal floor's warning delay expires while the player still has top-surface support contact
- **THEN** the floor stays solid long enough for that support contact to end
- **AND** the floor breaks immediately after the player leaves that support contact

### Requirement: Traversal platforms can modify jump flow
The game SHALL support special traversal surfaces such as spring platforms, bounce pods, gas vents, or lift-style platforms that alter player movement in intentional ways. Bounce pods and gas vents MUST behave as authored contact launchers that trigger on the first eligible top-surface contact while ready and apply a single launch impulse rather than continuous lift. A launcher that fires MUST consume readiness, MUST enter cooldown immediately, and MUST NOT retrigger while the same uninterrupted contact continues. Bounce pods MUST launch the player higher than gas vents under otherwise identical conditions and MUST recover readiness sooner than gas vents. Both launcher kinds MAY use an authored directional bias, but that direction MUST remain upward-biased and MUST stay within 25 degrees of straight up. Bounce pods and gas vents MUST remain distinct from spring platforms, anti-grav streams, gravity zones, and other continuous lift mechanics in authored data, runtime behavior, and presentation.

#### Scenario: Using a spring platform
- **WHEN** the player lands on a spring-like platform
- **THEN** the platform boosts the player with a stronger vertical launch than a normal jump

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

#### Scenario: Using a lift platform
- **WHEN** the player rides a lift or vertically moving platform
- **THEN** it carries the player along its authored route without breaking traversal readability

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

### Requirement: Timed-reveal secret routes stay readable, bounded, and safe
The game SHALL support authored timed-reveal secret routes that combine an existing reveal cue with a scanner-triggered temporary support path. Reveal MUST remain the discovery cue for the route and MUST NOT start the timed window. Scanner activation MUST remain the timer activator and MUST NOT broaden into arbitrary trigger combinations, chained trigger logic, or a generalized route-state framework. A timed-reveal route MUST place its reveal cue and scanner activator near the route they govern, MUST NOT allow the timer to begin before the route is legible from the authored traversal space, and MUST preserve a safe main-route fallback when the route is skipped or when its timed window expires. If the timed support expires while the player still has top-surface contact with it, that support MUST remain valid until the support contact ends and MUST then become hidden and non-solid immediately.

#### Scenario: Reading the route before activation
- **WHEN** the player reaches a timed-reveal secret route and triggers its reveal cue
- **THEN** the route becomes legible before any scanner-triggered timer begins

#### Scenario: Activating the timed window
- **WHEN** the player enters the linked scanner volume after the route is legible
- **THEN** the temporary support becomes active and its timer begins immediately

#### Scenario: Letting the secret route expire while occupied
- **WHEN** the timed window reaches expiry while the player still has top-surface support contact with the route
- **THEN** the support remains solid until that support contact ends
- **AND** it becomes hidden and non-solid immediately after the player leaves it

#### Scenario: Skipping the secret route
- **WHEN** the player ignores the timed-reveal branch or misses its timed window
- **THEN** the main route remains safely traversable without requiring the secret branch

### Requirement: Scanner switches control temporary floating bridges
The game SHALL support authored scanner switches that temporarily enable linked floating bridges. A temporary bridge MUST begin hidden and non-solid on a fresh attempt and MUST become visible and solid on the same update in which the player enters its linked scanner volume. The bridge timer MUST start on that activation update, and a later re-entry into the scanner volume after leaving it MUST refresh the bridge back to its full authored duration. If the timer elapses while the player is standing on the bridge's top surface, the bridge MUST remain valid support until that support contact ends, after which it MUST return to hidden and non-solid immediately. This mechanic MUST use the existing proximity/contact interaction model and MUST NOT require a new interact button or shooter-power-gated projectile activation.

#### Scenario: Activating a temporary bridge
- **WHEN** the player enters the authored scanner volume linked to a hidden temporary bridge
- **THEN** the bridge becomes visible and solid and its countdown starts immediately

#### Scenario: Refreshing a bridge timer
- **WHEN** the player leaves a scanner volume and later re-enters it before or after the linked bridge timer has elapsed
- **THEN** the bridge timer resets to its full authored duration from that new activation event

#### Scenario: Expiring while occupied
- **WHEN** the bridge timer reaches zero while the player still has top-surface support contact with the bridge
- **THEN** the bridge stays solid until that support contact ends and then immediately becomes hidden and non-solid

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

### Requirement: Moving platforms support stable grounded traversal
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Jumping from a moving platform
- **WHEN** the player jumps from a moving platform
- **THEN** the jump begins from a stable grounded state rather than a collision rejection state

### Requirement: Sticky sludge surfaces alter grounded traversal without replacing core controller semantics
The game SHALL support authored sticky sludge surfaces that change grounded traversal without replacing the existing controller model. While the player is grounded on sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed. A normal jump initiated from sticky sludge support, including a coyote jump sourced from that support, MUST use a reduced jump launch impulse. Sticky sludge MUST NOT require a new input, MUST NOT disable jump buffering or coyote time, and MUST NOT damp spring-launch or dash impulses.

#### Scenario: Running through sticky sludge
- **WHEN** the player holds movement input while grounded on sticky sludge
- **THEN** the player accelerates more slowly and reaches a lower grounded top speed than on normal ground

#### Scenario: Jumping from sticky sludge
- **WHEN** the player initiates a grounded jump or sludge-sourced coyote jump from sticky sludge
- **THEN** the jump starts with the reduced sticky-sludge launch impulse

#### Scenario: Launching from a spring on sticky sludge
- **WHEN** a spring launches the player from a sticky sludge section
- **THEN** the spring applies its normal launch impulse rather than a sludge-reduced impulse

#### Scenario: Dashing across sticky sludge
- **WHEN** the player dashes while entering, crossing, or leaving sticky sludge
- **THEN** the dash keeps its normal dash motion while active

### Requirement: Authored gravity fields create bounded airborne traversal variants
The game SHALL support authored gravity inversion columns and anti-grav streams as bounded rectangular field variants for airborne traversal. Both field kinds MUST affect only the player and only airborne vertical acceleration. An anti-grav stream MUST apply continuous upward-biased airborne acceleration while the player remains inside its authored rectangle and MUST NOT become grounded support, a one-shot launcher, or a generalized lift route. A gravity inversion column MUST reverse ongoing airborne vertical acceleration while the player remains inside its authored rectangle and MUST restore normal gravity immediately on exit. Neither field kind MUST change enemy or projectile gravity, grounded walking orientation, or arbitrary horizontal or vector-force physics.

#### Scenario: Entering an anti-grav stream
- **WHEN** the player becomes airborne inside an authored anti-grav stream rectangle
- **THEN** the stream applies its continuous upward-biased airborne acceleration only while the player remains inside that rectangle

#### Scenario: Entering a gravity inversion column
- **WHEN** the player is airborne and enters an authored gravity inversion column rectangle
- **THEN** the column reverses the player's ongoing airborne vertical acceleration only while the player remains inside that rectangle

#### Scenario: Leaving a gravity field
- **WHEN** the player exits an authored anti-grav stream or gravity inversion column
- **THEN** the player's airborne movement immediately returns to the normal gravity rule for the surrounding space

#### Scenario: Comparing a gravity field with a launcher
- **WHEN** the player uses a bounce pod, gas vent, or spring near a gravity field
- **THEN** the launcher remains a separate impulse-based traversal element and the gravity field remains a continuous airborne acceleration modifier

