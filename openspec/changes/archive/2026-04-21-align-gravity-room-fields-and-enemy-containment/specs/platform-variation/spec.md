## MODIFIED Requirements

### Requirement: Gravity capsule sections gate bounded gravity fields through one nearby button
The game SHALL support authored enclosed gravity room sections that bind one anti-grav stream or one gravity inversion column to a visible room shell, one side-wall entry door opening, one separate side-wall exit door opening, and one interior authored disable button. Each enclosed gravity room section MUST begin active on a fresh attempt, MUST apply its linked gravity field while active, and MUST disable that linked gravity field on the same update in which the player first gains eligible contact with the linked interior button. Once disabled, the section MUST stay disabled until death, checkpoint respawn, manual stage restart, or fresh stage start. The button MUST use the existing proximity or contact interaction family and MUST NOT require a new interact button, projectile trigger, timed hold, multi-button chain, re-enable sequence, or toggle-cycling logic. When active, the linked anti-grav stream or gravity inversion column MUST affect only the player and only ongoing airborne vertical acceleration across the room's full interior play volume rather than only inside a smaller authored sub-rectangle. Enclosed gravity rooms MAY include authored enemies inside that same room interior, but those enemies MUST keep their normal non-room gravity behavior and MUST remain readable as room-local encounters rather than as actors that inherit the room's gravity rule. The intended read of each enclosed gravity room MUST stay centered on that one gravity field plus one disable-button route, and the room MUST NOT depend on additional interior launcher, route-toggle, or unrelated traversal gimmicks to communicate its primary challenge. Entry and exit door openings for enclosed gravity rooms MUST sit on room side walls rather than on the bottom shell edge.

#### Scenario: Entering an active anti-grav room section
- **WHEN** the player becomes airborne anywhere inside an enclosed gravity room section whose linked field is an active anti-grav stream
- **THEN** the room applies the normal anti-grav airborne acceleration across that room's interior play volume while the player remains inside the room

#### Scenario: Entering an active gravity inversion room section
- **WHEN** the player becomes airborne anywhere inside an enclosed gravity room section whose linked field is an active gravity inversion column
- **THEN** the room reverses the player's ongoing airborne vertical acceleration across that room's interior play volume while the player remains inside the room

#### Scenario: Authoring an enemy inside an active enclosed gravity room
- **WHEN** an authored enemy occupies an enclosed gravity room while its linked field is active
- **THEN** that enemy keeps its normal enemy gravity and movement rules
- **AND** the room field still affects only the player

#### Scenario: Passing through a disabled gravity room section
- **WHEN** the player enters the interior of an enclosed gravity room section after its linked interior button has been triggered
- **THEN** that section no longer applies anti-grav or gravity-inversion acceleration anywhere in the room interior

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one side-wall entry opening and one separate side-wall exit opening, and shell space outside those two authored openings MUST behave as a sealed wall band rather than presentation-only outline. That sealed wall band MUST block player traversal and MUST also prevent room-local or room-external moving platforms, enemies, hazards, pickups, and other authored traversal content from crossing, overlapping, or otherwise trespassing through the shell outside the authored door openings. The full bottom edge of an enclosed gravity room MUST remain sealed and MUST NOT act as a door opening, pass-through strip, or helper-route substitute. Each section MUST fully contain its linked full-room player gravity volume, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. Enclosed gravity rooms MAY contain authored enemies on the room interior route or on exterior side-adjacent routes, but enemy containment MUST treat the room interior and room exterior as separate movement domains. An enemy that starts or patrols inside a gravity room MUST remain inside that room and MUST NOT leave through either side-wall door opening, and an enemy that starts outside a gravity room MUST remain outside and MUST NOT enter through either side-wall door opening. This enemy-containment rule MUST hold whether the room field is currently active or has already been disabled. The entry opening MUST connect to a reachable exterior-side approach path on the intended route that lets the player stand, approach, and enter the room through that doorway, and that path MAY be served by either a fixed platform or a moving platform only when that support is already part of the intended route and remains readable and usable for approach, landing, grounded traversal, and jump initiation into the room. The exit opening MUST connect from the intended interior route directly onto a usable exterior-side reconnect after the player leaves the room, and that reconnect MAY be served by fixed or moving platforms only when it is already part of the intended route and keeps the exit readable as a deliberate route continuation rather than a floating, above-room, or wrong-side opening. For the current playable gravity-room rollout, those entry-side and exit-side supports MUST reuse already-authored intended route-support geometry at the room sides, and the room MUST NOT depend on a dedicated extra support platform, helper ledge, bottom route strip, or compliance-only floor piece added solely to satisfy doorway checks. Outside approach and reconnect supports for the current rollout MUST remain side-adjacent to the room rather than above the room. When a door position changes, any related route-support platform adjustments and route-rectangle updates MUST stay aligned with that same side-adjacent platform path so the room entry and room exit remain one continuous authored traversal route. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

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
- **THEN** that room remains valid as long as its player route, button access, and side-wall flow also remain valid

#### Scenario: Retrying an enclosed gravity room with interior enemies
- **WHEN** the player retries a stage section with an enclosed gravity room that contains room-local enemies
- **THEN** the room returns to its active baseline
- **AND** those enemies still remain contained to their authored side of the room boundary