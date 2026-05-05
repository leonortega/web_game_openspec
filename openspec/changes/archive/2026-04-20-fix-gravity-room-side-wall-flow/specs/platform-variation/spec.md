## MODIFIED Requirements

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one side-wall entry door opening, one separate side-wall exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked gravity field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST still affect only the player and only airborne vertical acceleration inside its authored bounds. The intended read of each enclosed gravity room MUST stay centered on that one gravity field plus one disable-button route, and the room MUST NOT depend on additional interior launcher, route-toggle, or unrelated traversal gimmicks to communicate its primary challenge. Entry and exit door openings for enclosed gravity rooms MUST sit on room side walls rather than on the bottom shell edge.

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

#### Scenario: Reading a gravity-focused side-wall room challenge
- **WHEN** the player approaches or enters an enclosed gravity room section on the intended route
- **THEN** the room reads primarily as a gravity-field traversal plus disable-button challenge
- **AND** its entry and exit openings read as lateral side-wall flow rather than as floor cutouts

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one side-wall entry opening and one separate side-wall exit opening, and shell space outside those two authored openings MUST behave as a sealed wall band rather than presentation-only outline. That sealed wall band MUST block player traversal and MUST also prevent room-local or room-external moving platforms, enemies, hazards, pickups, and other authored traversal content from crossing, overlapping, or otherwise trespassing through the shell outside the authored door openings. The full bottom edge of an enclosed gravity room MUST remain sealed and MUST NOT act as a door opening, pass-through strip, or helper-route substitute. Each section MUST fully contain its linked gravity field, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. The entry opening MUST connect to a reachable exterior-side approach path on the intended route that lets the player stand, approach, and enter the room through that doorway, and that path MAY be served by either a fixed platform or a moving platform only when that support is already part of the intended route and remains readable and usable for approach, landing, grounded traversal, and jump initiation into the room. The exit opening MUST connect from the intended interior route directly onto a usable exterior-side reconnect after the player leaves the room, and that reconnect MAY be served by fixed or moving platforms only when it is already part of the intended route and keeps the exit readable as a deliberate route continuation rather than a floating, above-room, or wrong-side opening. For the current playable gravity-room rollout, those entry-side and exit-side supports MUST reuse already-authored intended route-support geometry at the room sides, and the room MUST NOT depend on a dedicated extra support platform, helper ledge, bottom route strip, or compliance-only floor piece added solely to satisfy doorway checks. Outside approach and reconnect supports for the current rollout MUST remain side-adjacent to the room rather than above the room. When a door position changes, any related route-support platform adjustments and route-rectangle updates MUST stay aligned with that same side-adjacent platform path so the room entry and room exit remain one continuous authored traversal route. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Contacting a sealed shell edge
- **WHEN** the player reaches an enclosed gravity room shell outside its authored entry or exit door opening
- **THEN** the shell blocks traversal as a room wall
- **AND** the player cannot pass through that sealed shell edge

#### Scenario: Contacting the sealed bottom edge
- **WHEN** the player reaches the bottom shell edge of an enclosed gravity room
- **THEN** that bottom edge behaves as a sealed wall band rather than as a doorway or pass-through strip

#### Scenario: External traversal content reaches a sealed shell band
- **WHEN** an authored enemy, moving platform, or other traversal content reaches an enclosed gravity room shell outside its authored door openings
- **THEN** that content remains contained to its valid side of the shell
- **AND** it does not cross or overlap the sealed shell band

#### Scenario: Approaching a gravity-room entry door on a side-adjacent path
- **WHEN** the player reaches an enclosed gravity room entry door on the intended route
- **THEN** the exterior side of that doorway is part of a usable side-adjacent platform path for standing, approach, and room entry

#### Scenario: Leaving through a gravity-room exit door onto a side-adjacent path
- **WHEN** the player reaches an enclosed gravity room exit door from the intended interior route
- **THEN** the doorway provides usable support for leaving the room
- **AND** the exit side reconnects to usable side-adjacent exterior support after the player crosses that opening

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path

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