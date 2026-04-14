## ADDED Requirements

### Requirement: Authored gravity fields create bounded airborne traversal variants
The game SHALL support authored gravity inversion columns and anti-grav streams as bounded rectangular field variants for airborne traversal. Both field kinds MUST affect only the player and only airborne vertical acceleration. An anti-grav stream MUST apply continuous upward-biased airborne acceleration while the player remains inside its authored rectangle and MUST NOT become grounded support, a one-shot launcher, or a generalized lift route. A gravity inversion column MUST reverse ongoing airborne vertical acceleration while the player remains inside its authored rectangle and MUST restore normal gravity immediately on exit. Neither field kind MUST change enemy or projectile gravity, grounded walking orientation, or arbitrary horizontal or vector-force physics.

#### Scenario: Entering an anti-grav stream
- **WHEN** the player becomes airborne inside an authored anti-grav stream rectangle
- **THEN** the stream applies its continuous upward-biased airborne acceleration only while the player remains inside that rectangle

#### Scenario: Entering a gravity inversion column
- **WHEN** the player is airborne and enters an authored gravity inversion column rectangle
- **THEN** the column reverses the player's ongoing airborne vertical acceleration only while the player remains inside that rectangle

#### Scenario: Leaving a gravity field
- **WHEN** the player exits an authored anti-grav stream or gravity inversion column
- **THEN** the player's airborne movement immediately returns to the normal gravity rule for the surrounding space

#### Scenario: Comparing a gravity field with a launcher
- **WHEN** the player uses a bounce pod, gas vent, or spring near a gravity field
- **THEN** the launcher remains a separate impulse-based traversal element and the gravity field remains a continuous airborne acceleration modifier

## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, scanner-triggered temporary bridge routes, and timed-reveal secret routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route, alternate line, or hidden secret connector branch by using existing moving, unstable, lift-style, spring-like, bounce-pod, gas-vent, low-gravity, reveal-platform, scanner-switch temporary-bridge, timed-reveal, or terrain-surface behaviors. Gravity inversion columns and anti-grav streams MAY be used for this purpose only as bounded authored rectangular field routes, and their primary authored rollout MUST stay centered on the Halo Spire Array sky section rather than broadening into uniform multi-stage use. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. Any timed-reveal secret route used for this purpose MUST combine those existing reveal and scanner behaviors without broadening into arbitrary trigger combinations or a generalized route-state framework. These high-air, hidden, timed, launcher-assisted, terrain-shaped, or gravity-field routes MUST remain readable and traversable without requiring ceiling walking, upside-down grounded support, arbitrary vector gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing the Halo Spire Array gravity-field section
- **WHEN** the player reaches the primary authored sky route that uses gravity inversion columns or anti-grav streams
- **THEN** the route reads as a bounded stage-authored traversal variation rather than a global gravity rewrite

#### Scenario: Discovering a timed-reveal secret branch
- **WHEN** the player reaches an authored hidden route that combines reveal and scanner mechanics
- **THEN** the route reads as a bounded optional traversal variant rather than a separate generalized trigger puzzle

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes