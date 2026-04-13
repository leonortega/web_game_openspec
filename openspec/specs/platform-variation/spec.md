# platform-variation Specification

## Purpose
Define dynamic terrain and platform behaviors that expand traversal variety while preserving readable platformer rules.
## Requirements
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
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, biome-authored launcher routes, and hidden reconnecting expedition secret routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route, alternate line, or hidden secret connector branch by using existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, scanner-switch temporary-bridge, or terrain-surface behaviors. Any secret route supported by these traversal sections MUST be discoverable through authored layout and the current movement and power rules, MUST remain traversable without adding a new interact button, map-marker system, or tracked secret-state mechanic, and MUST rejoin the main path later within the same stage. Any low-gravity traversal used for this purpose MUST be authored as a specific rectangular stage section and MUST affect only the player for this change. Any bounce-pod or gas-vent traversal used for this purpose MUST be authored as a bounded contact launcher footprint and MUST NOT rely on continuous lift fields, anti-grav streams, or gravity zones. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. These high-air, hidden, timed, launcher-assisted, or terrain-shaped routes MUST remain readable and traversable without requiring gravity inversion columns, anti-grav streams, magnetic platforms, gravity flip, directional gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing a hidden traversal connector
- **WHEN** the player uses an authored traversal mechanic to enter a hidden secret connector branch
- **THEN** the branch uses existing supported platform behaviors to reach an optional reward space or reconnecting line
- **AND** the branch rejoins the same stage's main route later without creating a separate completion outcome

#### Scenario: Revealing an optional timed bridge route
- **WHEN** the player enters the nearby scanner volume for an authored temporary bridge route
- **THEN** the linked bridge becomes visible and solid as part of a readable timed traversal line

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes

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

