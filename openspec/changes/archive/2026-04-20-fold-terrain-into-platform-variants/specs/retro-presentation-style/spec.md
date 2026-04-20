## ADDED Requirements

### Requirement: Full-platform brittle and sticky variants remain visually readable
The game SHALL present authored `brittleCrystal` and `stickySludge` platform variants with distinct readable cues that communicate their traversal identity across the full authored platform footprint rather than through smaller overlay patches. A brittle crystal platform MUST read as crystalline and fragile while intact, MUST intensify a visible warning cue across the platform during its break countdown, and MUST read as broken and non-supporting after collapse. A sticky sludge platform MUST read as viscous and drag-inducing across the whole platform surface, using a layered or subtly animated cue that remains legible during normal movement. These cues MUST stay consistent with the same authored platform extents used by simulation and validation.

#### Scenario: Reading a brittle platform before first contact
- **WHEN** the player approaches an intact brittle crystal platform
- **THEN** the whole platform reads as a distinct crystalline traversal hazard rather than normal ground or sticky sludge

#### Scenario: Reading a brittle warning state
- **WHEN** the player triggers a brittle crystal platform and its warning window begins
- **THEN** the warning presentation becomes visibly stronger across the full platform before it breaks

#### Scenario: Reading sticky sludge in motion
- **WHEN** the player crosses a sticky sludge platform at normal gameplay speed
- **THEN** the full platform remains visually distinguishable as sticky traversal even while the player is moving across it

#### Scenario: Comparing terrain visuals with authored data
- **WHEN** brittle or sticky platform variants are rendered in a migrated stage
- **THEN** their visible coverage matches the authored platform variant footprint rather than a legacy overlay rectangle