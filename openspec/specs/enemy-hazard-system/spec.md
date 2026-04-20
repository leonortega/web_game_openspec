# enemy-hazard-system Specification

## Purpose
Define encounter spacing, threat readability, and bounded enemy or hazard presentation rules that keep stage threats fair and recognizable.
## Requirements
### Requirement: Enemy encounters are authored with readable spacing and density
The game SHALL author enemy and hazard placements in readable encounter bands across each main stage. The critical path MUST provide enough footing, telegraph space, or lane separation for the player to parse each encounter before entering it, and optional detours MAY carry higher pressure only when they remain clearly optional and offer extra reward or faster traversal value. Major support surfaces MUST NOT stack multiple simultaneous threats so tightly that the authored route lacks a safe staging point or alternate lane.

#### Scenario: Entering a critical-path encounter
- **WHEN** the player reaches an enemy or hazard setup on the intended main route
- **THEN** there is enough readable space to identify the threat and choose a response before forced contact occurs

#### Scenario: Taking a higher-pressure optional branch
- **WHEN** the player enters an optional detour or reward pocket
- **THEN** that branch may present denser enemy pressure than the critical path while still preserving a readable route through it

#### Scenario: Recovering after a pressure spike
- **WHEN** the player clears a dense encounter band
- **THEN** the next safe foothold or transition beat gives them room to reset before the following escalation

### Requirement: Biome-linked turret variants remain bounded and readable
The game SHALL support authored biome-linked enemy variants as a bounded extension of existing enemy kinds rather than a generic enemy-system rewrite. For this change, the supported rollout MUST remain limited to the `turret` kind and MUST provide no more than two biome-specific turret variants: `resinBurst` for Ember Rift Warrens and `ionPulse` for Halo Spire Array. Each supported variant MUST preserve the turret's stationary support-based role, MUST expose a biome-specific visual telegraph before firing, and MUST keep its attack timing deterministic across retries.

#### Scenario: Encountering a turret variant for the first time
- **WHEN** the player reaches the first authored `resinBurst` or `ionPulse` turret encounter in its stage
- **THEN** that encounter introduces the variant in isolation with a safe foothold and enough telegraph space to read its firing pattern before forced contact

#### Scenario: Repeating a biome-linked turret encounter
- **WHEN** the player retries a stage containing a `resinBurst` or `ionPulse` turret
- **THEN** the turret uses the same authored telegraph timing and firing cadence for that variant on each attempt

#### Scenario: Rendering a biome-linked turret variant
- **WHEN** a supported turret variant begins its firing windup
- **THEN** its visible telegraph matches that variant's biome presentation and starts early enough to communicate the upcoming shot cadence before the projectile is spawned

### Requirement: Biome-linked turret variants are taught before mixed-encounter reuse
The game SHALL introduce each supported biome-linked turret variant through an authored teaching beat before reusing that variant in any later mixed encounter. A teaching beat MUST present the turret variant without simultaneous forced-contact pressure from another enemy or hazard in the same immediate lane. Any later mixed encounter using that variant MUST preserve the existing readability-first rules by keeping a safe staging point, separate lane, or other clear response window available to the player.

#### Scenario: Introducing the Ember Rift turret variant
- **WHEN** the player first reaches the authored `resinBurst` turret teaching beat in Ember Rift Warrens
- **THEN** the route provides safe support and recovery space to observe the longer telegraph and short burst before the player is asked to parse any additional pressure

#### Scenario: Reusing a turret variant in a later mixed encounter
- **WHEN** the player reaches a later encounter that combines a biome-linked turret variant with another enemy or hazard
- **THEN** the authored layout still provides lane separation, a safe staging foothold, or another readable response window before simultaneous pressure closes in

#### Scenario: Validating supported variant usage
- **WHEN** authored stage data assigns a biome-linked turret variant
- **THEN** that assignment is limited to the supported biome and turret kind combinations for this change and does not broaden into unrelated enemy kinds or unsupported stages

### Requirement: View-relevant enemy audibility preserves fairness and turret exceptions
The game SHALL make enemy motion, charge, or presence cues audible when the enemy becomes visible in the active camera view or enters an already-supported turret lead-margin that communicates imminent in-view danger. Viewpoint gating MUST remain tied to player-readable threat relevance rather than generic simulation activity, and it MUST NOT change enemy attack cadence, projectile timing, hazard timing, or encounter layout. Enemies that remain off-screen and not yet view-relevant MUST NOT emit repetitive presence audio.

#### Scenario: An enemy enters the camera view
- **WHEN** an enemy becomes visible in the active camera view while audio is available
- **THEN** the game may begin that enemy's readable motion, presence, or telegraph cue at that point

#### Scenario: A turret uses the existing lead-margin exception
- **WHEN** a turret reaches the supported lead-margin state that already warns of imminent in-view fire
- **THEN** its telegraph or firing cue may become audible before the turret is fully visible
- **AND** the exception preserves the current fairness semantics rather than becoming generic off-screen enemy audibility

#### Scenario: An enemy remains off-screen and not yet relevant
- **WHEN** an enemy continues simulating outside the active camera view and outside any supported lead-margin telegraph window
- **THEN** the game does not emit repetitive motion or presence audio for that enemy

### Requirement: Shooter enemies only fire while visible in the camera view
The game SHALL suppress shooter enemy firing, bullet emission, bullet visuals, and firing audio while the shooter is outside the active camera view beyond a measurable lead margin. Once the shooter becomes visible within that configured lead margin before fully entering the camera or viewbox, the shooter MAY resume normal firing and associated audio or visual cues. The lead margin MUST be consistent and testable in world units or tile units.

#### Scenario: Shooter begins far off-screen
- **WHEN** a shooter enemy is present but outside the camera or viewbox and outside the lead margin
- **THEN** it does not emit bullets or play bullet sounds

#### Scenario: Shooter approaches the viewport edge
- **WHEN** the shooter reaches the configured lead margin before fully entering the camera or viewbox
- **THEN** bullet projectiles and bullet sound cues can appear for that enemy before its body is fully visible

### Requirement: Enemy and hazard visuals remain readable under the reduced-detail presentation
The game SHALL preserve enemy and hazard readability under the denser 8-bit presentation pass. Dangerous enemies, hazard sources, active projectiles, and telegraph states MUST remain distinguishable from terrain and non-dangerous scenery through silhouette contrast, reserved accent colors, explicit state-shape changes, or bounded internal pixel detail rather than subtle shading alone. Under this pass, enemy and hazard rendering MUST use richer sprite-like pixel structure than the current coarse baseline while keeping routing-critical threat differences readable. Supported enemy art refreshes for this pass MUST remain original to the project rather than directly copying supplied reference art. Flying ovni or flyer enemies MUST place their brightest running-light or glow accents on the underside hull, belly rim, or other lower-body surface so they read as underside-lit saucers rather than top-capped drones. This presentation tightening MUST NOT change enemy behavior, projectile cadence, hazard timing, or encounter authoring.

#### Scenario: Reading a hazard against the stage backdrop
- **WHEN** the player views a damaging enemy or hazard in front of the denser stage presentation
- **THEN** its dangerous silhouette remains distinguishable from the surrounding terrain and props

#### Scenario: Reading a telegraph state
- **WHEN** an enemy or hazard enters a telegraph or windup state before becoming dangerous
- **THEN** that state is visible through a clear shape, cadence, accent, or pixel-detail change that remains readable in the bounded palette

#### Scenario: Tightening threat visuals without changing threat timing
- **WHEN** the denser 8-bit presentation pass is applied to enemies, hazards, and projectiles
- **THEN** their visuals become richer in sprite-like pixel detail without losing readability
- **AND** their telegraph timing and active danger cadence remain unchanged

#### Scenario: Preserving routing-critical readability under the tighter pass
- **WHEN** the player compares different enemies or hazards under the denser pixel treatment
- **THEN** the threats remain distinguishable through shape, spacing, motion state, reserved accents, or bounded pixel structure rather than fine texture noise alone

#### Scenario: Reading the refreshed flyer silhouette
- **WHEN** the player approaches a visible flying enemy after the visual refresh
- **THEN** the enemy reads as an underside-lit saucer or ovni through lower-hull accent placement and silhouette shape
- **AND** that refresh does not depend on directly copying the supplied reference image

### Requirement: Reduced-palette rendering does not hide routing-critical threat differences
The game SHALL keep routing-critical threat differences readable even when multiple enemies or hazards share a limited color vocabulary. Threats that require materially different player responses MUST remain distinguishable through shape, spacing, motion state, or reserved accent placement rather than depending only on small texture details.

#### Scenario: Comparing different threat types in the same stage
- **WHEN** the player sees two different enemy or hazard types during a stage
- **THEN** the threats remain distinguishable enough to support route planning and response choice within the flatter presentation style

#### Scenario: Reading an active projectile
- **WHEN** a hazard or enemy projectile crosses the screen
- **THEN** the projectile remains visually distinct from background decoration and passive props

### Requirement: Enemy and hazard motion feedback stays readable and deterministic
The game SHALL use bounded retro animation to communicate enemy movement and telegraph state without changing encounter fairness. Repeating enemy states such as idle watch, patrol or hover motion, windup, firing telegraph, and defeat feedback MUST read through deterministic low-frame pose changes, restrained tween accents, local particles, or a bounded combination of those treatments rather than purely static rendering. For this change, grounded foot enemies means the supported grounded walker and hopper enemy kinds only. Grounded walkers MUST expose readable walking or patrol motion while advancing, grounded hoppers MUST expose distinct crouch, launch, airborne, and landing-recovery poses, and ovni or flyer enemies MUST keep a separate hover presentation that uses local sparkling-light accents rather than foot-enemy gait states. Enemy defeat feedback MAY emit a short local disappearing-particle burst before the enemy fully vanishes, but that presentation MUST remain subordinate to existing spacing, attack timing, projectile cadence, defeat resolution, and telegraph windows. When an enemy is defeated by a player stomp, or by a Plasma Blaster projectile hit, the supported defeat feedback MUST keep the victim visible at its last world position for a brief local hold of about 96 ms before hide or destroy cleanup so a victim-side flash or tween can read. Stomp and Plasma Blaster enemy-defeat bursts MUST remain visibly distinct, MUST remain clearly visible above ordinary gameplay objects during mixed encounters, and MUST fully resolve within a short local presentation window that does not alter encounter timing.

#### Scenario: Reading a grounded enemy before committing to an encounter
- **WHEN** the player approaches a visible grounded walker or hopper enemy on the critical path
- **THEN** its current patrol, hop-prep, airborne, or recovery state is readable through bounded motion or pose change
- **AND** the player is not required to infer that state from a fully static sprite alone

#### Scenario: Reading a flyer hover state
- **WHEN** the player approaches a visible ovni or flyer enemy
- **THEN** its hover state remains readable through bounded hover motion and local sparkle accents
- **AND** it does not borrow grounded walk or hop presentation states

#### Scenario: Preserving telegraph fairness under animation
- **WHEN** an enemy or hazard enters a windup or firing telegraph state
- **THEN** the animation reinforces the existing dangerous state without shifting the underlying timing window
- **AND** retries preserve the same authored cadence and readable response window

#### Scenario: Comparing stomp and projectile defeat feedback
- **WHEN** the player defeats the same supported enemy kind once by stomping and once by a Plasma Blaster projectile
- **THEN** each defeat uses a visibly distinct local particle and victim-tween treatment that remains clearly visible above ordinary gameplay objects
- **AND** both treatments remain brief enough that nearby threats stay readable

#### Scenario: Reading enemy defeat feedback in a mixed encounter
- **WHEN** an enemy is defeated while other enemies, hazards, or projectiles remain active nearby
- **THEN** the defeated enemy may emit a short local disappearing-particle burst that matches its defeat cause and stays readable above ordinary gameplay objects
- **AND** the added feedback does not obscure the routing-critical threat states that remain active

#### Scenario: Reading the defeated enemy before cleanup
- **WHEN** a supported enemy defeat triggers
- **THEN** the defeated enemy remains visible briefly at the defeat position so a local flash or tween can read before the body hides
- **AND** the short visible hold does not change defeat timing, projectile cadence, or nearby enemy behavior

