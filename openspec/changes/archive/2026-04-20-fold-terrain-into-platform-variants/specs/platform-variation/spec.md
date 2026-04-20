## MODIFIED Requirements

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

## ADDED Requirements

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

### Requirement: Sticky sludge platform variants alter grounded traversal without altering jump semantics
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