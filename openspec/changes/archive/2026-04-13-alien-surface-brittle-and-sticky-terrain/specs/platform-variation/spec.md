## MODIFIED Requirements

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

## ADDED Requirements

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