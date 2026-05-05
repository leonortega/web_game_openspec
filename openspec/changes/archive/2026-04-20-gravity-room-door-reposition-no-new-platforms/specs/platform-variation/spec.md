## MODIFIED Requirements

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one bottom entry opening and one separate bottom exit opening, and shell space outside those two authored openings MUST behave as a sealed wall band rather than presentation-only outline. That sealed wall band MUST block player traversal and MUST also prevent room-local or room-external moving platforms, enemies, hazards, pickups, and other authored traversal content from crossing, overlapping, or otherwise trespassing through the shell outside the authored door openings. Each section MUST fully contain its linked gravity field, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. The bottom entry opening MUST connect to a reachable exterior-side approach path on the intended route that lets the player stand, approach, and enter the room through that doorway, and that path MAY be served by either a fixed platform or a moving platform so long as it remains readable and usable for approach, landing, grounded traversal, and jump initiation into the room. The bottom exit opening MUST connect to a reachable interior-side route through the room and to a usable exterior-side reconnect after leaving the room, and those supports MAY be served by fixed or moving platforms so long as the exit reads as a deliberate route continuation rather than as a floating or wrong-side opening. For the current playable gravity-room rollout, those entry-side and exit-side supports MUST reuse already-authored intended route-support geometry, and the room MUST NOT depend on a dedicated extra support platform added solely to satisfy door-side compliance. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

#### Scenario: Reading a contained gravity room route
- **WHEN** the player approaches an authored enclosed gravity room section
- **THEN** the shell, entry opening, exit opening, interior button, and contained route read as one bounded traversal segment rather than as a free-floating field rectangle

#### Scenario: Contacting a sealed shell edge
- **WHEN** the player reaches an enclosed gravity room shell outside its authored entry or exit door opening
- **THEN** the shell blocks traversal as a room wall
- **AND** the player cannot pass through that sealed shell edge

#### Scenario: External traversal content reaches a sealed shell band
- **WHEN** an authored enemy, moving platform, or other traversal content reaches an enclosed gravity room shell outside its authored door openings
- **THEN** that content remains contained to its valid side of the shell
- **AND** it does not cross or overlap the sealed shell band

#### Scenario: Approaching a gravity-room entry door
- **WHEN** the player reaches an enclosed gravity room bottom entry door on the intended route
- **THEN** the exterior side of that doorway provides usable support for standing, approach, and room entry

#### Scenario: Leaving through a gravity-room exit door
- **WHEN** the player reaches an enclosed gravity room bottom exit door from the intended interior route
- **THEN** the doorway provides usable support for leaving the room
- **AND** the exit side reconnects to usable exterior support after the player crosses that opening

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages. Across that rollout, each room MUST also keep a gravity-focused interior layout whose primary authored beats are room entry, in-room gravity traversal, disable-button access, and room exit, rather than a legacy bundle of unrelated room-local mechanics. For the current gravity rooms in that rollout, left-side entry and right-side exit compliance MUST be satisfied by repositioning door openings onto existing intended route-support platforms or moving supports that are already part of the room's authored traversal path, and those rooms MUST NOT add dedicated extra support platforms whose sole purpose is making the side-aware door rule pass.

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

#### Scenario: Repositioning a current gravity-room door without helper platforms
- **WHEN** a current playable enclosed gravity room must satisfy the side-aware entry-left and exit-right door contract
- **THEN** its door openings reuse existing intended route-support geometry on the relevant side
- **AND** the authored solution does not add a dedicated extra support platform whose sole purpose is satisfying doorway-side compliance