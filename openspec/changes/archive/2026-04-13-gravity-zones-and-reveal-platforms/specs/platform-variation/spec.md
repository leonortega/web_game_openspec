## MODIFIED Requirements

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors, authored traversal modifiers, and staged reveal routes to strengthen each stage's alien-biome identity rather than applying the same terrain gimmick uniformly everywhere. Each main stage MUST include at least one platform-driven traversal section that opens an elevated route or alternate line by using existing moving, unstable, lift-style, spring-like, low-gravity, or reveal-platform behaviors. Any low-gravity traversal used for this purpose MUST be authored as a specific rectangular stage section and MUST affect only the player for this change. Any reveal-platform route used for this purpose MUST begin hidden and non-solid on a fresh attempt, MUST reveal from a nearby authored reveal volume, and MUST remain readable and traversable once revealed. These high-air or hidden routes MUST remain reachable using the current movement and power rules and MUST NOT require gravity flip, directional gravity, jetpack flight, or presentation-only fake platforms.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior and platform layout reflect that stage's authored environment and pacing focus

#### Scenario: Crossing a low-gravity traversal pocket
- **WHEN** the player enters an authored low-gravity section that supports an elevated route
- **THEN** the route uses the altered airborne timing from that bounded section without changing gravity for enemies or the rest of the stage

#### Scenario: Revealing an optional support route
- **WHEN** the player enters the nearby reveal volume for a hidden platform route
- **THEN** the linked platform becomes visible and solid as part of a readable optional traversal line

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior and route shape rather than only palette changes