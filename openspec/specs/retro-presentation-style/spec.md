# retro-presentation-style Specification

## Purpose
Define the retro visual direction for gameplay-facing presentation, including palette restraint, silhouette rules, and optional analog-display guardrails.
## Requirements
### Requirement: Gameplay presentation uses an Atari 2600-inspired silhouette-first style
The game SHALL present active gameplay using a denser readable 8-bit console-inspired visual language defined by silhouette-first sprites and tiles, bounded palette ramps, flat fills with selective internal pixel detail, and restrained sprite-like motion rather than the earlier ultra-coarse silhouette-only pass. The presentation MUST move the player, enemies, terrain, and stage backdrops toward a more NES-like level of pixel complexity while preserving route readability, foreground versus background separation, and clear hazard contrast. When a stage defines authored backdrop palette inputs such as sky and ground colors, the active stage backdrop MUST derive its background bands, decorative motifs, and texture accents from those authored inputs or bounded derivatives of them, and it MUST keep those background colors and details visually secondary to playable terrain, hazards, and other foreground gameplay surfaces. Refreshed enemy designs for this pass MUST remain original to the project, MAY take style direction from supplied reference material, and MUST NOT directly copy or reproduce that reference image. Supported flying enemies MUST read as underside-lit saucers or ovnis through lower-hull accent placement and bounded retro detailing rather than top-heavy cap accents alone. The refreshed backdrop language MUST evoke extraterrestrial or planetary spacescapes through original low-detail motifs such as distant planet disks, ring arcs, crater ridges, alien horizons, and sparse star fields, and it MUST not directly copy or reproduce the supplied background reference image.

#### Scenario: Viewing active gameplay
- **WHEN** the player enters a playable stage
- **THEN** the terrain, enemies, player-facing props, and backdrop motifs present denser 8-bit pixel detail than broad single-color slabs
- **AND** the presentation does not rely on smooth gradients or modern texture treatment to achieve that detail

#### Scenario: Reading foreground routes against the backdrop
- **WHEN** the player views platforms, hazards, or other traversable gameplay surfaces against the stage backdrop
- **THEN** the backdrop colors and motif detail remain visually secondary
- **AND** the background bands or decorative accents do not blend into the same color role as the playable route

#### Scenario: Comparing presentation intent to hardware emulation
- **WHEN** the updated gameplay presentation is evaluated against the change requirements
- **THEN** it reads as a denser 8-bit console-inspired style with clearer sprite and tile detail than the current coarse pass
- **AND** it does not require literal hardware-era emulation or exact console reproduction to satisfy the contract

#### Scenario: Tightening visuals without changing play behavior
- **WHEN** the denser 8-bit presentation pass is applied to active gameplay visuals
- **THEN** the visible presentation becomes richer in pixel detail and more sprite-and-tile-like
- **AND** player control timing, enemy cadence, and authored route behavior remain unchanged

#### Scenario: Presenting original planetary backdrops
- **WHEN** the game renders a stage backdrop after this change
- **THEN** the background reads as an original extraterrestrial spacescape rather than a generic abstract pattern
- **AND** it does not directly reproduce the supplied reference image

#### Scenario: Presenting refreshed enemy art in the same style family
- **WHEN** the player compares refreshed enemy designs during active play
- **THEN** the enemies read as original retro-styled sprites in the same visual family as the rest of the game
- **AND** the flying-enemy variants read through underside lighting and lower-hull accents rather than copied reference details

### Requirement: Optional analog-display effects remain secondary to readability
Any optional scanline, CRT, flicker, or similar analog-display treatment used by this change SHALL remain subtle, SHALL never be required to communicate gameplay state, and SHALL preserve readability of the HUD, player state, hazards, and transition text. Any optional backdrop-only separation effect used to keep scenery distinct from the playable route MUST remain secondary to the authored stage palette, MUST NOT make the backdrop brighter or more attention-grabbing than the foreground, and MUST preserve the readability of HUD and transition overlays that sit above the stage view. Planetary or extraterrestrial backdrop motifs MUST also stay low-density enough that readable paths, hazard telegraphs, and power silhouettes remain more visually dominant than the scenery.

#### Scenario: Enabling an optional analog-style treatment
- **WHEN** the game renders with an optional scanline, CRT, or flicker-inspired treatment
- **THEN** that treatment remains visually secondary to gameplay information
- **AND** stage text, HUD values, and hazard telegraphs remain readable without depending on the effect

#### Scenario: Applying a subtle backdrop separation effect
- **WHEN** the stage presentation adds a backdrop-only effect to improve foreground separation
- **THEN** the effect does not become the primary focal point of the scene
- **AND** player powers, hazards, HUD text, and transition text remain readable over the updated background

#### Scenario: Reading a route over planetary scenery
- **WHEN** extraterrestrial backdrop motifs such as planets, rings, or crater horizons appear behind the route
- **THEN** platforms, hazards, pickups, and the player silhouette remain easier to read than the scenery
- **AND** the backdrop does not introduce foreground-color clashes that obscure active play

### Requirement: Short-lived effects remain secondary to route readability
The game SHALL use low-frame animation, short tweens, and bounded particles as supporting retro presentation accents rather than as dominant spectacle. Event-driven effects for player actions, checkpoints, research samples, power gain, exit completion, enemy telegraphs, enemy defeat, and player defeat MUST stay short-lived, palette-bounded, and spatially local so they reinforce the playable state without hiding hazards, terrain edges, HUD text, or transition copy. Supported exit-completion feedback MUST render as a short capsule-entry teleport or dematerialization effect that stays local to the endpoint, keeps the multipart player readable through the start of the finish beat, and fully resolves before the normal completion-scene handoff. Supported defeat bursts for stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player defeat MUST render above the ordinary gameplay object stack so they remain clearly visible during live play, and their bounded particle count, spread, contrast, or lifetime MUST be strong enough to stay readable against busy stage art without changing defeat timing or respawn cadence. Supported defeat presentation MUST also keep the defeated victim visible at its last world position for a brief local hold of no more than 120 ms so a defeat flash or tween can read before that victim hides. The accompanying victim tween, flash, and explosion treatment MUST remain local and MUST fully resolve within 320 ms of the defeat trigger. Player defeat feedback MUST read as a brief blow-apart burst plus victim-side defeat tween that hands off cleanly into respawn, and enemy defeat feedback MUST read as a short disappearing-particle burst plus victim-side defeat tween that resolves locally around the defeated enemy. Stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player defeat MUST each use a distinct bounded visual treatment so the event class stays readable at a glance while preserving the same shared retro motion language. This shared motion language MUST continue to read as sprite-first retro presentation rather than modern smooth effects work.

#### Scenario: Reading gameplay during a local feedback burst
- **WHEN** the player triggers a jump, pickup, checkpoint, power gain, enemy telegraph accent, or defeat effect during active play
- **THEN** the effect remains spatially local and brief enough that nearby route-critical information stays readable
- **AND** the screen does not fill with persistent ambient particles or large overlapping effects

#### Scenario: Reading an exit teleport finish
- **WHEN** the player reaches a valid exit and the capsule-entry finish starts
- **THEN** the teleport or dematerialization effect stays centered on the exit endpoint and the player's last readable position
- **AND** the multipart player disappears cleanly within the short bounded finish window without obscuring nearby route-critical geometry

#### Scenario: Reading a player defeat burst
- **WHEN** the player dies during active play
- **THEN** the blow-apart effect stays centered on the player's last position, keeps the player briefly visible for the bounded defeat tween window, renders clearly above ordinary gameplay objects, and remains brief enough to hand off cleanly into the existing respawn flow

#### Scenario: Comparing defeat classes
- **WHEN** the player observes a stomp kill, a Plasma Blaster projectile kill, and a player death during active play
- **THEN** each event class reads as a distinct bounded retro effect
- **AND** the effects still feel like members of the same restrained presentation family

#### Scenario: Comparing retro accents to modern effects styling
- **WHEN** the updated presentation is evaluated during gameplay or transitions
- **THEN** the added motion still reads as restrained retro pose or accent work
- **AND** it does not rely on long easing chains, screen-filling blooms, or other dominant modern visual treatments

#### Scenario: Repeating the same event class
- **WHEN** the same supported event class happens repeatedly under the same conditions
- **THEN** the same class of bounded visual feedback is used consistently
- **AND** that consistency does not require constant continuous emission between event triggers

#### Scenario: Reading defeat particles in a mixed encounter
- **WHEN** a supported defeat burst happens while other enemies, hazards, terrain props, or projectiles remain active nearby
- **THEN** the burst remains clearly visible above ordinary gameplay objects
- **AND** it stays bounded enough that the still-active route and threats remain readable

#### Scenario: Reading the victim-side defeat cue before hide
- **WHEN** a supported enemy or player defeat triggers during active play
- **THEN** the defeated victim stays visible briefly at the defeat position so a local flash or tween can read before hide cleanup
- **AND** the total victim-side defeat presentation still resolves within the short bounded defeat window

### Requirement: Game shell scales up presentation on roomy displays without changing gameplay resolution
The game SHALL present its browser shell as a centered responsive container that grows substantially larger on roomy desktop viewports than the current baseline while preserving the existing internal gameplay resolution and Phaser scaling behavior. The enlarged shell MUST remain bounded by viewport-aware sizing so the game continues to fit on smaller laptops and mobile screens without horizontal overflow, clipped UI, or off-center framing. This shell-sizing change MUST remain presentation-only and MUST NOT alter gameplay timing, authored stage dimensions, camera semantics, or HUD meaning.

#### Scenario: Viewing the game on a large desktop display
- **WHEN** the player opens the game on a desktop viewport with enough width and height to support a larger shell
- **THEN** the centered game presentation renders substantially larger than the current baseline instead of staying near the prior 1080 px shell cap
- **AND** the underlying gameplay resolution and scene behavior remain unchanged

#### Scenario: Viewing the game on a constrained display
- **WHEN** the player opens the game on a smaller laptop, tablet, or mobile-sized viewport
- **THEN** the shell still fits within the available viewport without horizontal scrolling or clipped primary game content
- **AND** the presentation remains centered and readable

#### Scenario: Comparing shell sizing to gameplay behavior
- **WHEN** the enlarged shell presentation is evaluated during menu, transition, or active gameplay flow
- **THEN** the change reads as a browser-shell sizing adjustment rather than a gameplay zoom or resolution change
- **AND** player timing, stage layout, and camera behavior remain the same as before

### Requirement: Gravity capsule presentation stays readable and distinct from stage exits
The game SHALL present enclosed gravity room sections as local retro-styled traversal infrastructure rather than as stage-completion endpoints. Each enclosed gravity room section MUST keep a readable outlined room shell except for one bottom entry opening and one separate bottom exit opening, and it MUST keep one linked interior disable button readable in both active and disabled states. Room-local platforms, enemies, terrain, pickups, hazards, and other interior content inside these enclosed gravity rooms MUST keep their normal authored gameplay presentation rather than being force-recolored solely because they sit inside the room. Active rooms MUST visibly communicate that the gravity field is live, disabled rooms MUST visibly communicate that the field has been neutralized, and the traversal room MUST remain clearly distinct from the stage-exit capsule through shell framing, door treatment, button state, field-state cues, or equivalent local accents. Enclosed gravity rooms MUST NOT reuse the exit-finish teleport or dematerialization treatment.

#### Scenario: Reading an active enclosed gravity room section
- **WHEN** the player approaches an enclosed gravity room section before its linked interior disable button has been triggered
- **THEN** the shell, bottom door openings, button, field cues, and normally presented interior content read as an active traversal device rather than as a live exit or already neutralized route

#### Scenario: Reading a disabled enclosed gravity room section
- **WHEN** the player views an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the shell, door openings, button, or field cues visibly change so the room reads as neutralized during traversal
- **AND** interior room content keeps its same authored presentation identity instead of switching to a room-only recolor palette

#### Scenario: Comparing an enclosed gravity room section with the stage exit
- **WHEN** the player sees an enclosed gravity room section and the stage-completion capsule in the same play session
- **THEN** the traversal room reads as a separate mechanic and is not mistaken for the stage exit

#### Scenario: Comparing rolled-out gravity rooms across stages
- **WHEN** the player encounters enclosed gravity rooms in different current playable stages
- **THEN** each room uses the same shell-and-button presentation grammar while still preserving stage-specific layout, route shape, and normal interior content colors

### Requirement: Stage-exit capsule presentation stays grounded and distinct from traversal capsules
The game SHALL present the stage-completion exit as a grounded capsule endpoint with readable local footing, base structure, or adjacent support cues rather than as a floating traversal prop. The stage-exit capsule MUST remain visually distinct from gravity capsule sections through silhouette, local base treatment, finish-only state cues, or equivalent bounded presentation differences. Fresh stage entry and automatic next-stage advance MAY present a short mirrored capsule-arrival appearance beat at the player's authored start position, and that beat MUST use the same capsule shell and door design as the stage-completion exit. The stage-start presentation MUST reverse the exit-finish disappearance language into an arrival or rematerialization beat, MUST use a separate fixed grounded start-cabin position instead of player-derived cabin placement, MUST continue into a short automatic player walk-out, and MUST resolve into an inert closed-door prop before active play begins. The completion endpoint MUST reserve disappearance-style teleport or dematerialization feedback for valid stage completion only, while stage-start capsule feedback is limited to bounded appearance or rematerialization presentation plus the scripted walk-out and short post-walk door-close beat before active control begins. The persistent start cabin MUST remain non-interactive after that beat resolves and MUST stay grounded on supported stage footing before, during, and after the sequence. Even though start and exit share the same capsule design, the start cabin MUST read as arrival-only infrastructure through its fresh-start timing, reversed effect direction, fixed grounded placement, automatic walk-out, and inert closed final state rather than through separate art. Valid stage completion through the exit capsule MUST also trigger a short explicit door-open animation on that grounded exit cabin, and that open beat MUST stay local, readable, and distinct from the inert post-arrival start cabin state. Once the exit-finish disappearance passes the point where the player is no longer meant to be visible, ordinary multipart player rendering MUST remain suppressed until the normal completion-scene handoff.

#### Scenario: Reading a grounded exit endpoint
- **WHEN** the player approaches the stage-completion capsule during active play
- **THEN** the endpoint reads as a supported grounded exit on the intended route rather than a floating rectangle or generic traversal device

#### Scenario: Reading a stage-start capsule arrival
- **WHEN** a fresh stage attempt begins or the game auto-advances into a new stage
- **THEN** the player spawn presentation may use a short mirrored capsule-arrival appearance beat at a fixed grounded start-cabin position with the same capsule design as the exit endpoint
- **AND** the effect stays local and bounded enough that route-critical geometry around the spawn remains readable

#### Scenario: Reading a persistent start cabin after walk-out
- **WHEN** the player gains control after a fresh stage-start arrival resolves
- **THEN** the start cabin remains behind as a grounded inert prop with the same closed capsule design family as the exit endpoint
- **AND** it does not read as a usable exit, traversal capsule, or player-attached object during active play

#### Scenario: Reading the exit door-open finish
- **WHEN** the player completes a stage through the grounded exit capsule
- **THEN** the exit cabin plays a short readable door-open beat as part of the finish presentation
- **AND** that beat stays local to the endpoint and does not obscure nearby route-critical geometry

#### Scenario: Comparing the stage exit with a traversal capsule
- **WHEN** the player sees the stage-completion capsule and a gravity capsule section in the same play session
- **THEN** the completion endpoint reads as a separate finish device rather than another traversal capsule

#### Scenario: Comparing stage-start arrival with stage completion
- **WHEN** the player sees a stage-start capsule arrival and later completes the same or another stage through the exit capsule
- **THEN** the stage-start beat reads as an arrival event through reversed effect direction, fixed grounded placement, and automatic walk-out rather than as a second completion endpoint
- **AND** the exit capsule still reads as the only valid completion endpoint that owns disappearance-style finish feedback and the exit-only door-open beat

#### Scenario: Watching disappearance finish after hide
- **WHEN** the player has already disappeared during a valid exit-finish sequence
- **THEN** ordinary player-part rendering remains suppressed until the results handoff completes
### Requirement: Full-platform brittle and sticky variants remain visually readable
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