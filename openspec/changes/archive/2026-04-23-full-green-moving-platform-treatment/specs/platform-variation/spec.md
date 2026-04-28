## MODIFIED Requirements

### Requirement: Traversal mechanic categories remain visually distinct in play
The game SHALL present existing traversal mechanics with a readable category-level visual language beyond shared rectangle tinting alone. For this requirement, assisted movement includes bounce pods, gas vents, moving platforms, lift-style platforms, and unstable or falling support surfaces; route toggles includes reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule button or shell-state cues; gravity modifiers includes anti-grav streams, gravity inversion columns, and enabled gravity-capsule field interiors. Each category MUST stay readable at gameplay speed through bounded in-world cues tied to the authored footprint, and each mechanic within a category MUST preserve a distinct sub-identity so players can still tell support carry, impulse launch, route activation, and airborne gravity change apart without relying on HUD text or color alone. Moving platforms specifically MUST reuse the same full-green safe-support body treatment used by ordinary safe platforms rather than a separate dark-body plus cool-top split, and they MUST preserve assisted-movement readability through vertical markers or another clearly bounded local cue tied to the moving-platform footprint.

#### Scenario: Reading an assisted-movement route
- **WHEN** the player approaches a traversal beat that uses bounce pods, gas vents, moving supports, or unstable supports
- **THEN** those mechanics read as one contact-driven assistance family
- **AND** each mechanic still exposes enough local detail to distinguish carry, launch, or failing-support behavior

#### Scenario: Reading a moving platform against plain safe support
- **WHEN** the player compares a moving platform with a nearby ordinary safe platform
- **THEN** the moving platform keeps the same full-green safe-support body treatment instead of a darker split-body treatment
- **AND** the moving platform still exposes local assisted-movement markers or an equivalent cue that distinguishes carry support from ordinary static footing

#### Scenario: Reading a route-toggle relationship
- **WHEN** the player reaches a reveal route, temporary bridge, magnetic route, or gravity-capsule gate before or during activation
- **THEN** the activator and the governed route read as one bounded local toggle relationship rather than unrelated generic rectangles

#### Scenario: Comparing a gravity modifier with a launcher
- **WHEN** the player sees or traverses an anti-grav stream or gravity inversion column near a bounce pod or gas vent
- **THEN** the gravity field reads as a continuous airborne-space modifier
- **AND** the launcher still reads as a discrete impulse surface rather than another gravity field