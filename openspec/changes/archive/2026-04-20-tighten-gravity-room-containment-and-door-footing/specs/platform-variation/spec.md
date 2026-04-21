## MODIFIED Requirements

### Requirement: Gravity capsule sections remain route-contained and bounded
The game SHALL author every enclosed gravity room section as a contained traversal segment rather than as an unframed field in empty space. Each section MUST use a room shell that is fully enclosed on all sides except for one bottom entry opening and one separate bottom exit opening, and shell space outside those two authored openings MUST behave as a sealed wall band rather than presentation-only outline. That sealed wall band MUST block player traversal and MUST also prevent room-local or room-external moving platforms, enemies, hazards, pickups, and other authored traversal content from crossing, overlapping, or otherwise trespassing through the shell outside the authored door openings. Each section MUST fully contain its linked gravity field, interior disable button, essential support geometry, and any other room-local content that remains necessary for the intended route. Each bottom door opening MUST connect to explicit usable local footing that supports readable approach, landing, grounded traversal, and jump initiation on the intended route rather than acting as a floating or inaccessible opening. Each room MUST place its linked disable button on an intended reachable interior route after room entry and before any route beat that depends on the disabled state, and MUST keep the intended route through the room reachable and not cut off by cropped geometry or shell bounds. Every enclosed gravity room MUST be large enough that its remaining platforms, button, and traversal route fit cleanly inside the room shell without clipping or unreachable placement. An enclosed gravity room section MUST remain safely retryable when it resets to its active baseline and MUST NOT broaden into generalized room-state logic, fake support, or arbitrary non-rectangular gravity simulation.

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

#### Scenario: Traversing a gravity-room door opening
- **WHEN** the player approaches an enclosed gravity room bottom entry or bottom exit door on the intended route
- **THEN** the door connects to explicit usable footing that supports standing, landing, and continuing traversal through that opening

#### Scenario: Retrying an enclosed gravity room section
- **WHEN** the player retries a stage section with an enclosed gravity room after a reset event
- **THEN** the room returns to its active baseline
- **AND** the entry-side route still allows the player to reach the interior disable button and continue through the intended room path