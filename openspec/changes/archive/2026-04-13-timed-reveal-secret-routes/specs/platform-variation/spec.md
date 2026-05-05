## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, and timed-reveal secret routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route, alternate line, or hidden secret connector branch by using existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, scanner-switch temporary-bridge, timed-reveal, or terrain-surface behaviors. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. These high-air, hidden, timed, launcher-assisted, or terrain-shaped routes MUST remain readable and traversable without requiring gravity inversion columns, anti-grav streams, magnetic platforms, gravity flip, directional gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes

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