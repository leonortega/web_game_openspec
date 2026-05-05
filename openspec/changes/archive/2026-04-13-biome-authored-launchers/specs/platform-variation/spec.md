## MODIFIED Requirements

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
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, and biome-authored launcher routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route or alternate line by using existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, or scanner-switch temporary-bridge behaviors. Any low-gravity traversal used for this purpose MUST be authored as a specific rectangular stage section and MUST affect only the player for this change. Any bounce-pod or gas-vent traversal used for this purpose MUST be authored as a bounded contact launcher footprint and MUST NOT rely on continuous lift fields, anti-grav streams, or gravity zones. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. These high-air, hidden, timed, or launcher-assisted routes MUST remain readable and traversable without requiring gravity inversion columns, anti-grav streams, magnetic platforms, gravity flip, directional gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing a biome launcher route
- **WHEN** the player reaches an authored bounce pod or gas vent section that opens an elevated or optional line
- **THEN** that route uses bounded contact launches that read as part of the local biome rather than as a generic spring reskin or gravity field

#### Scenario: Crossing a low-gravity traversal pocket
- **WHEN** the player enters an authored low-gravity section that supports an elevated route
- **THEN** the route uses the altered airborne timing from that bounded section without changing gravity for enemies or the rest of the stage

#### Scenario: Revealing an optional timed bridge route
- **WHEN** the player enters the nearby scanner volume for an authored temporary bridge route
- **THEN** the linked bridge becomes visible and solid as part of a readable timed traversal line

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes