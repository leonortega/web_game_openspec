# platform-variation Specification

## Purpose
Define dynamic terrain and platform behaviors that expand traversal variety while preserving readable platformer rules.
## Requirements
### Requirement: Stages support dynamic platform behaviors
The game SHALL support authored platform behaviors beyond static ground so stages can introduce movement-based traversal challenges. Dynamic traversal support MUST include moving platforms, unstable or collapsing support, and full-platform terrain variants such as brittle crystal platforms and sticky sludge platforms. Brittle crystal and sticky sludge MUST no longer be authored as separate partial terrain-overlay rectangles. Each supported behavior MUST follow predictable rules that players can learn through repetition. Empty-platform sections MUST use a broad mechanic mix and MUST NOT rely only on jump-timing beats over plain static support. For each authored empty-platform run that is marked as a traversal challenge segment, stage data MUST include at least two distinct platform-mechanic families from this supported set: moving, unstable or collapsing, spring traversal, sticky, brittle, reveal-platform, scanner-switch temporary bridge, activation-node magnetic platform, or bounded gravity-field traversal.

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

#### Scenario: Authoring an empty-platform run with only jump timing
- **WHEN** stage data defines a qualifying empty-platform traversal challenge run that uses only plain static jump timing without another supported mechanic family
- **THEN** authored validation rejects that run before runtime use

#### Scenario: Authoring an empty-platform run with mixed mechanics
- **WHEN** stage data defines a qualifying empty-platform traversal challenge run with at least two distinct supported mechanic families
- **THEN** authored validation accepts that run as meeting dynamic-platform variety requirements

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe, and SHALL support brittle crystal platforms that behave as one-shot delayed-collapse static support. For falling-platform collapse timing, collapse progression MUST remain contact-aware rather than first-touch fixed, including `stayArmThresholdMs` and `hopGapThresholdMs` behavior defined in the existing contract. For brittle crystal platforms, warning progression MUST remain occupancy-driven: brittle warning elapsed time MUST increase only while the player has top-surface support contact on that brittle platform. Staying, walking, and short hop-jump recontacts on the same brittle platform MUST continue that same occupancy progression when unsupported gaps are at or below `hopGapThresholdMs`, while larger unsupported gaps before readiness MUST reset brittle warning progression back to intact. A brittle platform whose warning progression reaches full duration MUST enter a ready-to-break state and MUST start a deterministic final-transition timer with `readyBreakDelayMs = 220`. While that ready timer has remaining time, the platform MUST remain valid solid top-surface support and MUST allow normal grounded movement and jump initiation, including landing onto that ready platform from a nearby platform. The ready timer MUST continue decreasing regardless of current occupancy or support contact. On the first update where ready-state elapsed time reaches or exceeds `readyBreakDelayMs`, that brittle platform MUST break and fall even if support contact is still active. Falling-platform behavior in this requirement remains unchanged.

#### Scenario: Entering ready-to-break state starts timer
- **WHEN** brittle warning progression first reaches full duration
- **THEN** the platform enters ready-to-break state and starts its 220 ms final-transition timer on that same update

#### Scenario: Ready brittle remains usable before timer expiry
- **WHEN** a brittle platform is in ready-to-break state and its final-transition timer has remaining time
- **THEN** the platform remains solid and landable as normal support
- **AND** the player can still initiate a grounded jump from that support

#### Scenario: Landing onto ready brittle from adjacent support
- **WHEN** the player jumps from a neighboring platform and lands on a brittle platform already in ready-to-break state before timer expiry
- **THEN** that landing resolves as valid top-surface support
- **AND** normal jump initiation remains available until timer expiry

#### Scenario: Break by time while still occupied
- **WHEN** a brittle platform stays occupied through the full ready-to-break delay
- **THEN** it still transitions to broken/falling immediately when the ready timer reaches 220 ms
- **AND** it does not require a leave transition to break

#### Scenario: Falling platform behavior is unaffected
- **WHEN** falling platforms run their contact-aware arm and countdown logic in the same stage
- **THEN** their `stayArmThresholdMs` and `hopGapThresholdMs` semantics remain unchanged by brittle final-transition timing

### Requirement: Brittle and sticky terrain stay bounded to full static-platform variants
The game SHALL author brittle crystal and sticky sludge only as full-platform variants on static platforms unless a later change explicitly broadens that support. These variants MUST NOT be authored as partial overlays, free-floating rectangles, separate terrain-surface collections, or default combinations on moving, unstable, lift-style, launcher, or other dynamic platform kinds in this contract. Validation and runtime ingestion MUST treat platform identity and the platform-owned terrain-variant field as the only source of truth for these variants.

#### Scenario: Authoring a valid brittle or sticky platform variant
- **WHEN** stage data marks a supported static platform as `brittleCrystal` or `stickySludge`
- **THEN** the full authored platform footprint uses that variant for validation, runtime, and rendering

#### Scenario: Authoring a legacy terrain overlay
- **WHEN** stage data attempts to define brittle or sticky terrain as a separate overlay rectangle, terrain-surface record, or other non-platform-owned shape instead of a platform variant
- **THEN** that authored data is rejected before runtime use

#### Scenario: Authoring a dynamic brittle or sticky platform
- **WHEN** stage data attempts to place a brittle or sticky variant on a moving, unstable, lift-style, launcher, or other non-static platform
- **THEN** validation rejects that authored data unless another explicit capability has broadened support

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

### Requirement: Current main stages restore live brittle and sticky platform rollout
The game SHALL use authored full-platform `brittleCrystal` and `stickySludge` static-platform surface mechanics as live traversal beats in the shipped main campaign instead of confining those mechanics to non-campaign fixtures only. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST each contain at least one visibly authored brittle or sticky platform-surface beat on current shipped route geometry or a readable nearby branch. Across those three stages, the restored rollout MUST include at least one live `brittleCrystal` beat and at least one live `stickySludge` beat. Restored beats MUST keep the current static-platform surface-mechanic contract, MUST preserve current brittle warning or delayed-break or reset semantics and current sticky grounded-drag-only semantics, and MUST read visually as authored terrain variants rather than as unchanged plain green support. Because pre-removal coordinates are not authoritative, restored beats MAY use newly authored placements that fit the current shipped catalog so long as they remain readable and traversable.

#### Scenario: Entering a restored main-stage terrain beat
- **WHEN** the player reaches Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array in the shipped campaign
- **THEN** that stage includes at least one visibly authored brittle or sticky full-platform terrain beat
- **AND** that beat uses the current static-platform `surfaceMechanic.kind` contract instead of a legacy overlay or hidden normal-platform presentation

#### Scenario: Comparing restored campaign terrain rollout
- **WHEN** the player compares the three current main stages
- **THEN** each stage includes at least one visibly authored brittle or sticky full-platform terrain beat on current route geometry or a readable nearby branch
- **AND** the combined rollout still includes both `brittleCrystal` and `stickySludge`

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
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal. If a moving platform's authored motion ends that top-surface support contact by clearing out from under the player's occupied footprint, the player MUST begin falling from the same occupied position on that detach update, and that former support MUST NOT immediately resolve as a same-frame horizontal wall for that update alone.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Jumping from a moving platform
- **WHEN** the player jumps from a moving platform
- **THEN** the jump begins from a stable grounded state rather than a collision rejection state

#### Scenario: Falling when a moving platform clears away
- **WHEN** a moving platform's motion ends valid top-surface support by moving away from under the player's occupied footprint
- **THEN** the player begins falling from the position they occupied on that platform
- **AND** the former support does not shove the player sideways as a same-frame horizontal blocker on that detach update

### Requirement: Sticky sludge surfaces alter grounded traversal without replacing core controller semantics
The game SHALL support authored sticky sludge platform variants that change grounded traversal without replacing the existing controller model. While the player is grounded on sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed only. Sticky sludge MUST NOT require a new input, MUST NOT disable jump buffering or coyote time, MUST NOT change grounded jump launch strength, and MUST NOT damp bounce-pod, gas-vent, or dash impulses.

#### Scenario: Running through sticky sludge
- **WHEN** the player holds movement input while grounded on sticky sludge
- **THEN** the player accelerates more slowly and reaches a lower grounded top speed than on normal ground

#### Scenario: Jumping from sticky sludge
- **WHEN** the player initiates a grounded jump or coyote jump from sticky sludge support
- **THEN** the jump uses the same launch strength rules as normal ground

#### Scenario: Launching from a launcher on sticky sludge
- **WHEN** a bounce pod or gas vent launches the player from a sticky sludge platform
- **THEN** that launcher applies its normal launch impulse rather than a sticky-modified impulse

#### Scenario: Dashing across sticky sludge
- **WHEN** the player dashes while entering, crossing, or leaving sticky sludge
- **THEN** the dash keeps its normal dash motion while active

### Requirement: Existing special terrain surfaces remain visually distinct in play
The game SHALL present authored `brittleCrystal` and `stickySludge` platform variants with distinct readable cues that communicate their traversal identity across the full authored platform footprint rather than through smaller overlay patches or separate terrain-surface render layers. A brittle crystal platform MUST read as crystalline and fragile while intact, MUST show a clearly intensifying warning cue while occupancy-driven brittle progression is active, and MUST show a distinct ready-to-break read before collapse if warning completion occurs while still occupied. A sticky sludge platform MUST read as viscous and drag-inducing across the whole platform surface, using a layered or subtly animated cue that remains legible during normal movement. These cues MUST stay consistent with the same authored platform extents used by simulation and validation.

#### Scenario: Reading brittle occupancy progression
- **WHEN** the player stays, walks, or hop-jumps on a brittle crystal platform during warning progression
- **THEN** the platform's warning visuals visibly intensify across the full authored footprint while progression is active

#### Scenario: Reading ready-to-break brittle support
- **WHEN** brittle warning progression completes while the player still occupies the platform
- **THEN** the platform shows a distinct ready-to-break visual state before collapse on leave

#### Scenario: Comparing terrain visuals with authored data
- **WHEN** brittle or sticky platform variants are rendered in a migrated stage
- **THEN** their visible coverage matches the authored platform variant footprint rather than a legacy overlay rectangle or separate terrain-surface render primitive

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
- **WHEN** the player uses a bounce pod or gas vent near a gravity field
- **THEN** the launcher remains a separate impulse-based traversal element and the gravity field remains a continuous airborne acceleration modifier

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one side-wall entry door opening, one separate side-wall exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked gravity field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST affect only the player and only ongoing airborne vertical acceleration across the room's full interior play volume rather than only inside a smaller authored sub-rectangle. While that room field remains active, a player jump initiated from valid support inside the room MUST use the room's inverse jump takeoff rather than the normal upward jump takeoff. Buffered jump resolution and coyote-time jump resolution sourced from that same active room support MUST follow the same inverse takeoff rule. Each enclosed gravity room MUST place its linked disable button on the intended interior route so that the player can still reach and touch that button while the room field is active by using the room's inverse jump semantics and existing contact interaction rules. The intended read of each enclosed gravity room MUST stay centered on that one gravity field plus one disable-button route, and the room MUST NOT depend on a legacy normal-jump assumption, a moved-outside-room button beat, a gravity-toggle shortcut on jump, or a compliance-only helper platform to make the route work. Enclosed gravity rooms MAY include authored enemies inside that same room interior, but those enemies MUST keep their normal non-room gravity behavior, MUST remain readable as room-local encounters rather than as actors that inherit the room's gravity rule, and MUST NOT crowd, pin, or replace the intended deactivation route to the button. Entry and exit door openings for enclosed gravity rooms MUST sit on room side walls rather than on the bottom shell edge.

#### Scenario: Entering an active anti-grav room section
- **WHEN** the player becomes airborne anywhere inside an enclosed gravity room section whose linked field is an active anti-grav stream
- **THEN** the room applies the normal anti-grav airborne acceleration across that room's interior play volume while the player remains inside the room

#### Scenario: Entering an active gravity inversion room section
- **WHEN** the player becomes airborne anywhere inside an enclosed gravity room section whose linked field is an active gravity inversion column
- **THEN** the room reverses the player's ongoing airborne vertical acceleration across that room's interior play volume while the player remains inside the room

#### Scenario: Jumping from support inside an active enclosed gravity room
- **WHEN** the player initiates a grounded, buffered, or coyote-time jump from valid support inside an enclosed gravity room whose linked field is still active
- **THEN** that jump begins with the room-scoped inverse takeoff instead of the normal upward takeoff
- **AND** the linked room field continues applying its authored airborne rule after that takeoff begins

#### Scenario: Reaching the button in an active enclosed gravity room
- **WHEN** the player enters an active enclosed gravity room and follows its intended interior route toward the linked disable button
- **THEN** that route remains readable and reachable while the room field is still active under the room's inverse jump semantics
- **AND** the button can be disabled through existing contact interaction without moving the button outside the room beat or adding a validator-only helper platform

#### Scenario: Authoring an enemy inside an active enclosed gravity room
- **WHEN** an authored enemy occupies an enclosed gravity room while its linked field is active
- **THEN** that enemy keeps its normal enemy gravity and movement rules
- **AND** the room field still affects only the player

#### Scenario: Authoring contained enemies without blocking the button route
- **WHEN** stage data defines one or more contained interior enemies inside an enclosed gravity room
- **THEN** those enemies remain valid only if the player can still read and traverse the intended active-field route to the interior disable button
- **AND** the encounter does not force unavoidable blocking contact on the only deactivation lane

#### Scenario: Passing through a disabled gravity room section
- **WHEN** the player enters the interior of an enclosed gravity room section after its linked interior button has been triggered
- **THEN** that section no longer applies anti-grav or gravity-inversion acceleration anywhere in the room interior
- **AND** player jump initiation inside that disabled room returns to the surrounding normal jump rule

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one side-wall entry opening and one separate side-wall exit opening, and shell space outside those two authored openings MUST behave as a sealed wall band rather than presentation-only outline. That sealed wall band MUST block player traversal and MUST also prevent room-local or room-external moving platforms, enemies, hazards, pickups, and other authored traversal content from crossing, overlapping, or otherwise trespassing through the shell outside the authored door openings. The full bottom edge of an enclosed gravity room MUST remain sealed and MUST NOT act as a door opening, pass-through strip, or helper-route substitute. Each section MUST fully contain its linked full-room player gravity volume, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. Enclosed gravity rooms MAY contain authored enemies on the room interior route or on exterior side-adjacent routes, but enemy containment MUST treat the room interior and room exterior as separate movement domains. An enemy that starts or patrols inside a gravity room MUST remain inside that room and MUST NOT leave through either side-wall door opening, and an enemy that starts outside a gravity room MUST remain outside and MUST NOT enter through either side-wall door opening. This enemy-containment rule MUST hold whether the room field is currently active or has already been disabled. The entry opening MUST connect to a reachable exterior-side approach path on the intended route that lets the player stand, approach, and enter the room through that doorway, and that path MAY be served by either a fixed platform or a moving platform only when that support is already part of the intended route and remains readable and usable for approach, landing, grounded traversal, and inverse-jump initiation into the room while the field is active. The exit opening MUST connect from the intended interior route directly onto a usable exterior-side reconnect after the player leaves the room, and that reconnect MAY be served by fixed or moving platforms only when it is already part of the intended route and keeps the exit readable as a deliberate route continuation rather than a floating, above-room, or wrong-side opening. For the current playable gravity-room rollout, those entry-side and exit-side supports MUST reuse already-authored intended route-support geometry at the room sides, and the room MUST NOT depend on a dedicated extra support platform, helper ledge, bottom route strip, or compliance-only floor piece added solely to satisfy doorway checks. Outside approach and reconnect supports for the current rollout MUST remain side-adjacent to the room rather than above the room. When a door position changes, any related route-support platform adjustments and route-rectangle updates MUST stay aligned with that same side-adjacent platform path so the room entry and room exit remain one continuous authored traversal route. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and that route MUST remain reachable while the room field is still active by using the room's inverse jump and contact interaction rules. The room MUST keep the button route and the intended route through the room readable and not cut off by cropped geometry, shell bounds, misleading active-room jump arcs, or interior enemy placement that blocks the only deactivation lane. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Inside enemy reaches a room door
- **WHEN** an authored enemy inside an enclosed gravity room reaches the room's entry or exit door opening
- **THEN** that enemy remains contained to the room interior
- **AND** it does not transfer onto the room's exterior route

#### Scenario: Outside enemy reaches a room door
- **WHEN** an authored enemy outside an enclosed gravity room reaches that room's entry or exit door opening
- **THEN** that enemy remains on the exterior side of the room boundary
- **AND** it does not enter the room interior

#### Scenario: Authoring a contained enemy encounter inside a gravity room
- **WHEN** stage data defines an enclosed gravity room with one or more interior enemies that remain contained to the room interior
- **THEN** that room remains valid as long as its player route, button access, inverse-jump readability, and side-wall flow also remain valid

#### Scenario: Rejecting a button route that needs fake support
- **WHEN** stage data places a gravity-room button or route so the player can only reach the button by using a dedicated helper ledge, compliance-only floor piece, or other support added solely to satisfy validation
- **THEN** that room is rejected as invalid authored data before runtime use

#### Scenario: Rejecting an interior encounter that blocks button access
- **WHEN** stage data places a contained interior enemy so that the only intended route to the active-room disable button is unreadable or blocked by unavoidable enemy contact under inverse jump semantics
- **THEN** that room is rejected as invalid authored data before runtime use

#### Scenario: Retrying an enclosed gravity room with interior enemies
- **WHEN** the player retries a stage section with an enclosed gravity room that contains room-local enemies
- **THEN** the room returns to its active baseline
- **AND** those enemies still remain contained to their authored side of the room boundary

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages. Across that rollout, each room MUST also keep a gravity-focused interior layout whose primary authored beats are room entry, in-room gravity traversal, disable-button access, and room exit, rather than a legacy bundle of unrelated room-local mechanics. For the current gravity rooms in that rollout, `IN` MUST mean left-side side-wall room entry and `OUT` MUST mean right-side side-wall room exit from the player-facing read of the room, not merely from a technically reachable opening pair. The rollout MUST remove bottom-edge doorway openings entirely, and any current yellow-marked door or platform arrangement that is wrong for doorway flow MUST either be removed entirely or remain only as non-doorway geometry that no longer serves as the entry or exit solution. Left-side entry and right-side exit compliance MUST be satisfied by repositioning door openings onto existing intended route-support platforms or moving supports that are already part of the room's authored traversal path, and those rooms MUST NOT add dedicated extra support platforms, helper ledges, bottom route strips, or fake low bottom-door workarounds whose sole purpose is making the side-aware door rule pass. `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` MUST each preserve the enclosed-room shell, linked gravity field, interior disable button, and retry or reset behavior while being re-authored under that same side-wall `IN`-left and `OUT`-right rule.

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

#### Scenario: Authoring forest room side-wall IN and OUT flow
- **WHEN** `forest-anti-grav-canopy-room` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side side-wall room entry and its `OUT` doorway uses a right-side side-wall room exit
- **AND** no bottom-edge doorway or doorway-only bottom support remains as the active solution

#### Scenario: Authoring amber room side-wall IN and OUT flow
- **WHEN** `amber-inversion-smelter-room` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side side-wall room entry and its `OUT` doorway uses a right-side side-wall room exit
- **AND** no bottom-edge doorway or doorway-only bottom support remains as the active solution

#### Scenario: Authoring sky anti-grav room side-wall IN and OUT flow
- **WHEN** `sky-anti-grav-capsule` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side side-wall room entry and its `OUT` doorway uses a right-side side-wall room exit
- **AND** the room does not rely on a helper ledge, doorway-only compliance platform, bottom route strip, or fake low bottom-door workaround to achieve that flow

#### Scenario: Authoring sky inversion room side-wall IN and OUT flow
- **WHEN** `sky-gravity-inversion-capsule` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side side-wall room entry and its `OUT` doorway uses a right-side side-wall room exit
- **AND** any geometry that remains from a prior wrong doorway arrangement no longer counts as the entry or exit solution

#### Scenario: Repositioning a current gravity-room door onto existing side support
- **WHEN** a current playable enclosed gravity room must satisfy the side-aware entry-left and exit-right door contract
- **THEN** its door openings reuse existing intended route-support geometry on the relevant side
- **AND** the authored solution does not add a dedicated extra support platform, helper ledge, or bottom route strip whose sole purpose is satisfying doorway-side compliance

### Requirement: Traversal mechanic categories remain visually distinct in play
The game SHALL present existing traversal mechanics with a readable category-level visual language beyond shared rectangle tinting alone. For this requirement, assisted movement includes bounce pods, gas vents, moving platforms, lift-style platforms, and unstable or falling support surfaces; route toggles includes reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule button or shell-state cues; gravity modifiers includes anti-grav streams, gravity inversion columns, and enabled gravity-capsule field interiors. Each category MUST stay readable at gameplay speed through bounded in-world cues tied to the authored footprint, and each mechanic within a category MUST preserve a distinct sub-identity so players can still tell support carry, impulse launch, route activation, and airborne gravity change apart without relying on HUD text or color alone. Moving platforms specifically MUST reuse the same full-green safe-support body treatment used by ordinary safe platforms rather than a separate dark-body plus cool-top split, and they MUST preserve assisted-movement readability through vertical markers or another clearly bounded local cue tied to the moving-platform footprint.

#### Scenario: Reading an assisted-movement route
- **WHEN** the player approaches a traversal beat that uses bounce pods, gas vents, moving supports, or unstable supports
- **THEN** those mechanics read as one contact-driven assistance family
- **AND** each mechanic still exposes enough local detail to distinguish carry, launch, or failing-support behavior

#### Scenario: Reading a moving platform against plain safe support
- **WHEN** the player compares a moving platform with a nearby ordinary safe platform
- **THEN** the moving platform keeps the same full-green safe-support body treatment instead of a darker split-body treatment
- **AND** the moving platform still exposes local assisted-movement markers or an equivalent cue that distinguishes carry support from ordinary static footing

#### Scenario: Reading a route-toggle relationship
- **WHEN** the player reaches a reveal route, temporary bridge, magnetic route, or gravity-capsule gate before or during activation
- **THEN** the activator and the governed route read as one bounded local toggle relationship rather than unrelated generic rectangles

#### Scenario: Comparing a gravity modifier with a launcher
- **WHEN** the player sees or traverses an anti-grav stream or gravity inversion column near a bounce pod or gas vent
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

