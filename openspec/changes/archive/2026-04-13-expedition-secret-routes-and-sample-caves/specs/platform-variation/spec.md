## MODIFIED Requirements

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