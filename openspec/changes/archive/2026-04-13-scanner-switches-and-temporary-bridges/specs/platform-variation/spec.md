## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, staged reveal routes, and scanner-triggered temporary bridge routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route or alternate line by using existing moving, unstable, lift-style, spring-like, low-gravity, reveal-platform, or scanner-switch temporary-bridge behaviors. Any low-gravity traversal used for this purpose MUST be authored as a specific rectangular stage section and MUST affect only the player for this change. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. Any scanner-switch temporary bridge route used for this purpose MUST activate from a nearby authored scanner volume, MUST not require a new interact button, and MUST remain reachable using the current movement and power rules. These high-air, hidden, or timed routes MUST remain readable and traversable without requiring gravity inversion columns, anti-grav streams, magnetic platforms, gravity flip, directional gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Revealing an optional timed bridge route
- **WHEN** the player enters the nearby scanner volume for an authored temporary bridge route
- **THEN** the linked bridge becomes visible and solid as part of a readable timed traversal line

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes

## ADDED Requirements

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
