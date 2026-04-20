# platform-variation Specification

## Purpose
Define dynamic terrain and platform behaviors that expand traversal variety while preserving readable platformer rules.
## Requirements
### Requirement: Stages support dynamic platform behaviors
The game SHALL support authored platform behaviors beyond static ground so stages can introduce movement-based traversal challenges. Dynamic traversal support MUST include moving platforms, unstable or collapsing support, and full-platform terrain variants such as brittle crystal platforms and sticky sludge platforms. Brittle crystal and sticky sludge MUST no longer be authored as separate partial terrain-overlay rectangles. Each supported behavior MUST follow predictable rules that players can learn through repetition.

#### Scenario: Encountering a moving platform
- **WHEN** the player reaches a section with a moving platform
- **THEN** the platform follows its authored path and timing consistently

#### Scenario: Repeating a traversal section
- **WHEN** the player retries the same dynamic platform section
- **THEN** the platform or full-platform variant behavior remains readable and consistent with prior attempts

#### Scenario: Entering a brittle platform section
- **WHEN** the player first steps onto an authored brittle crystal platform from above
- **THEN** that full platform begins its readable brittle-warning state using the authored brittle-platform rules

#### Scenario: Entering a sticky platform section
- **WHEN** the player moves across an authored sticky sludge platform
- **THEN** the traversal section uses the authored sticky-platform movement rules consistently across retries

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal platforms that behave as one-shot delayed-collapse static support. A falling platform MUST continue to act as valid support for grounded movement and jump initiation while the player still has top-surface contact with it. A brittle crystal platform MUST be authored as a static platform variant, MUST start its warning countdown only after first top-surface contact, MUST remain fully solid across its full authored footprint during that warning window, and MUST become broken and non-supporting across that full footprint after the warning delay unless the player is still using its top surface for support at the instant of expiry. If the warning delay expires while the player still has top-surface support contact, the brittle platform MUST remain valid support only until that support contact ends and MUST then break immediately.

#### Scenario: Standing on a collapsing platform
- **WHEN** the player lands on an unstable platform
- **THEN** the platform gives a short readable warning before dropping or failing

#### Scenario: Leaving a collapsing platform early
- **WHEN** the player exits the unstable platform before it fails
- **THEN** the player can continue traversal if they moved in time

#### Scenario: Jumping during platform descent
- **WHEN** the platform has started falling but the player is still standing on its top surface
- **THEN** the player can still jump normally from that platform

#### Scenario: Triggering a brittle crystal platform
- **WHEN** the player lands on a brittle crystal platform's top surface for the first time in the current attempt
- **THEN** the full platform shows a readable warning and remains usable during its short delay

#### Scenario: Escaping a brittle crystal platform at expiry
- **WHEN** a brittle crystal platform's warning delay expires while the player still has top-surface support contact
- **THEN** the full platform stays solid long enough for that support contact to end
- **AND** the full platform breaks immediately after the player leaves that support contact

### Requirement: Brittle and sticky terrain stay bounded to full static-platform variants
The game SHALL author brittle crystal and sticky sludge only as full-platform variants on static platforms unless a later change explicitly broadens that support. These variants MUST NOT be authored as partial overlays, free-floating rectangles, or default combinations on moving, unstable, lift-style, launcher, or other dynamic platform kinds in this contract. Validation and runtime ingestion MUST treat platform identity as the source of truth for these terrain variants.

#### Scenario: Authoring a valid brittle or sticky platform variant
- **WHEN** stage data marks a supported static platform as `brittleCrystal` or `stickySludge`
- **THEN** the full authored platform footprint uses that variant for validation, runtime, and rendering

#### Scenario: Authoring a legacy terrain overlay
- **WHEN** stage data attempts to define brittle or sticky terrain as a separate overlay rectangle instead of a platform variant
- **THEN** that authored data is rejected before runtime use

#### Scenario: Authoring a dynamic brittle or sticky platform
- **WHEN** stage data attempts to place a brittle or sticky variant on a moving, unstable, lift-style, launcher, or other non-static platform
- **THEN** validation rejects that authored data unless another explicit capability has broadened support

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
The game SHALL support authored sticky sludge platform variants that change grounded traversal without replacing the existing controller model. While the player is grounded on sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed. Sticky sludge MUST NOT require a new input, MUST NOT disable jump buffering or coyote time, MUST NOT change grounded jump launch strength, and MUST NOT damp spring-launch, biome-launcher, or dash impulses.

#### Scenario: Running through sticky sludge
- **WHEN** the player holds movement input while grounded on sticky sludge
- **THEN** the player accelerates more slowly and reaches a lower grounded top speed than on normal ground

#### Scenario: Jumping from sticky sludge
- **WHEN** the player initiates a grounded jump or coyote jump from sticky sludge support
- **THEN** the jump uses the same launch strength rules as normal ground

#### Scenario: Launching from a spring on sticky sludge
- **WHEN** a spring launches the player from a sticky sludge platform
- **THEN** the spring applies its normal launch impulse rather than a sticky-modified impulse

#### Scenario: Dashing across sticky sludge
- **WHEN** the player dashes while entering, crossing, or leaving sticky sludge
- **THEN** the dash keeps its normal dash motion while active

### Requirement: Existing special terrain surfaces remain visually distinct in play
The game SHALL present authored `brittleCrystal` and `stickySludge` platform variants with distinct readable cues that communicate their traversal identity across the full authored platform footprint rather than through smaller overlay patches. A brittle crystal platform MUST read as crystalline and fragile while intact, MUST intensify a visible warning cue across the platform during its break countdown, and MUST read as broken and non-supporting after collapse. A sticky sludge platform MUST read as viscous and drag-inducing across the whole platform surface, using a layered or subtly animated cue that remains legible during normal movement. These cues MUST stay consistent with the same authored platform extents used by simulation and validation.

#### Scenario: Reading a brittle platform before first contact
- **WHEN** the player approaches an intact brittle crystal platform
- **THEN** the whole platform reads as a distinct crystalline traversal hazard rather than normal ground or sticky sludge

#### Scenario: Reading a brittle warning state
- **WHEN** the player triggers a brittle crystal platform and its warning window begins
- **THEN** the warning presentation becomes visibly stronger across the full platform before it breaks

#### Scenario: Reading sticky sludge in motion
- **WHEN** the player crosses a sticky sludge platform at normal gameplay speed
- **THEN** the full platform remains visually distinguishable as sticky traversal even while the player is moving across it

#### Scenario: Comparing terrain visuals with authored data
- **WHEN** brittle or sticky platform variants are rendered in a migrated stage
- **THEN** their visible coverage matches the authored platform variant footprint rather than a legacy overlay rectangle

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

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one bottom entry door opening, one separate bottom exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST still affect only the player and only airborne vertical acceleration inside its authored bounds. The intended read of each enclosed gravity room MUST stay centered on that one gravity field plus one disable-button route, and the room MUST NOT depend on additional interior launcher, route-toggle, or unrelated traversal gimmicks to communicate its primary challenge.

#### Scenario: Entering an active anti-grav room section
- **WHEN** the player becomes airborne inside an enclosed gravity room section whose linked field is an active anti-grav stream
- **THEN** the room applies the normal anti-grav airborne acceleration only while the player remains inside the authored field bounds

#### Scenario: Entering an active gravity inversion room section
- **WHEN** the player becomes airborne inside an enclosed gravity room section whose linked field is an active gravity inversion column
- **THEN** the room reverses the player's ongoing airborne vertical acceleration only while the player remains inside the authored field bounds

#### Scenario: Disabling an enclosed gravity room section
- **WHEN** the player first gains eligible contact with an enclosed gravity room section's linked interior disable button
- **THEN** that room section disables its linked gravity field on the same update
- **AND** the field remains disabled until a reset event occurs

#### Scenario: Passing through a disabled gravity room section
- **WHEN** the player enters the authored bounds of an enclosed gravity room section after its linked interior button has been triggered
- **THEN** that section does not apply anti-grav or gravity-inversion acceleration

#### Scenario: Reading a gravity-focused room challenge
- **WHEN** the player approaches or enters an enclosed gravity room section on the intended route
- **THEN** the room reads primarily as a gravity-field traversal plus disable-button challenge
- **AND** it does not require an unrelated interior mechanic stack to understand the route

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one bottom entry opening and one separate bottom exit opening, and shell space outside those two authored openings MUST behave as blocking room walls rather than presentation-only outline. Each section MUST fully contain its linked gravity field, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. Room-local content inside an enclosed gravity room MUST stay limited to content needed to support the gravity traversal, button access, or exit reachability, and current playable rooms MUST remove non-essential pickups, hazards, enemies, launchers, or other mixed mechanics where they are not needed for that contained route. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Contacting a sealed shell edge
- **WHEN** the player reaches an enclosed gravity room shell outside its authored entry or exit door opening
- **THEN** the shell blocks traversal as a room wall
- **AND** the player cannot pass through that sealed shell edge

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages. Across that rollout, each room MUST also keep a gravity-focused interior layout whose primary authored beats are room entry, in-room gravity traversal, disable-button access, and room exit, rather than a legacy bundle of unrelated room-local mechanics.

#### Scenario: Loading Verdant Impact Crater
- **WHEN** Verdant Impact Crater is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Ember Rift Warrens
- **WHEN** Ember Rift Warrens is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Halo Spire Array
- **WHEN** Halo Spire Array is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Comparing room rollout across stages
- **WHEN** the player compares current playable stages with enclosed gravity sections
- **THEN** each stage uses the full enclosed-room rollout with its own authored room geometry and route shape rather than leaving legacy open-field exceptions behind
- **AND** each room still reads as a gravity-focused traversal segment rather than a mixed-mechanic bundle

### Requirement: Traversal mechanic categories remain visually distinct in play
The game SHALL present existing traversal mechanics with a readable category-level visual language beyond shared rectangle tinting alone. For this requirement, assisted movement includes spring platforms, bounce pods, gas vents, moving platforms, lift-style platforms, and unstable or falling support surfaces; route toggles includes reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule button or shell-state cues; gravity modifiers includes anti-grav streams, gravity inversion columns, and enabled gravity-capsule field interiors. Each category MUST stay readable at gameplay speed through bounded in-world cues tied to the authored footprint, and each mechanic within a category MUST preserve a distinct sub-identity so players can still tell support carry, impulse launch, route activation, and airborne gravity change apart without relying on HUD text or color alone.

#### Scenario: Reading an assisted-movement route
- **WHEN** the player approaches a traversal beat that uses springs, launchers, moving supports, or unstable supports
- **THEN** those mechanics read as one contact-driven assistance family
- **AND** each mechanic still exposes enough local detail to distinguish carry, launch, or failing-support behavior

#### Scenario: Reading a route-toggle relationship
- **WHEN** the player reaches a reveal route, temporary bridge, magnetic route, or gravity-capsule gate before or during activation
- **THEN** the activator and the governed route read as one bounded local toggle relationship rather than unrelated generic rectangles

#### Scenario: Comparing a gravity modifier with a launcher
- **WHEN** the player sees or traverses an anti-grav stream or gravity inversion column near a spring, bounce pod, or gas vent
- **THEN** the gravity field reads as a continuous airborne-space modifier
- **AND** the launcher still reads as a discrete impulse surface rather than another gravity field

### Requirement: Route-toggle traversal states communicate locally
The game SHALL communicate route-toggle traversal state changes through local in-world cues on the same update that route availability changes. Reveal platforms and scanner-triggered temporary bridges MUST gain a readable active treatment when they become solid, magnetic platforms MUST shift from dormant to powered support when their linked activation node fires, and gravity capsule buttons and shell cues MUST read as dormant versus enabled gate state without implying free-standing solid support. These state cues MUST remain local to the activator or governed route, MUST reset consistently on fresh attempts or retry events, and MUST NOT introduce a generalized puzzle HUD, screen-space prompt, or global room-state presentation.

#### Scenario: Activating a temporary bridge route
- **WHEN** the player enters a scanner volume that enables a temporary bridge
- **THEN** the bridge becomes visually readable as active support on that same update
- **AND** the cue remains local to the bridge and linked scanner relationship

#### Scenario: Powering a magnetic route
- **WHEN** the player triggers an activation node linked to a dormant magnetic platform
- **THEN** the node and platform both shift to a readable powered route state on that same update

#### Scenario: Enabling a gravity capsule section
- **WHEN** the player activates a gravity capsule section's linked button
- **THEN** the button and capsule shell read as an enabled gate state
- **AND** the field interior reads as an active gravity modifier rather than a newly spawned solid platform

