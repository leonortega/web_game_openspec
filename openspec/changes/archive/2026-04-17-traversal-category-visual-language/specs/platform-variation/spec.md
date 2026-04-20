## ADDED Requirements

### Requirement: Traversal mechanic categories remain visually distinct in play
The game SHALL present existing traversal mechanics with a readable category-level visual language beyond shared rectangle tinting alone. For this requirement, assisted movement includes spring platforms, bounce pods, gas vents, moving platforms, lift-style platforms, and unstable or falling support surfaces; route toggles includes reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule button or shell-state cues; gravity modifiers includes anti-grav streams, gravity inversion columns, and enabled gravity-capsule field interiors. Each category MUST stay readable at gameplay speed through bounded in-world cues tied to the authored footprint, and each mechanic within a category MUST preserve a distinct sub-identity so players can still tell support carry, impulse launch, route activation, and airborne gravity change apart without relying on HUD text or color alone.

#### Scenario: Reading an assisted-movement route
- **WHEN** the player approaches a traversal beat that uses springs, launchers, moving supports, or unstable supports
- **THEN** those mechanics read as one contact-driven assistance family
- **AND** each mechanic still exposes enough local detail to distinguish carry, launch, or failing-support behavior

#### Scenario: Reading a route-toggle relationship
- **WHEN** the player reaches a reveal route, temporary bridge, magnetic route, or gravity-capsule gate before or during activation
- **THEN** the activator and the governed route read as one bounded local toggle relationship rather than unrelated generic rectangles

#### Scenario: Comparing a gravity modifier with a launcher
- **WHEN** the player sees or traverses an anti-grav stream or gravity inversion column near a spring, bounce pod, or gas vent
- **THEN** the gravity field reads as a continuous airborne-space modifier
- **AND** the launcher still reads as a discrete impulse surface rather than another gravity field

### Requirement: Route-toggle traversal states communicate locally
The game SHALL communicate route-toggle traversal state changes through local in-world cues on the same update that route availability changes. Reveal platforms and scanner-triggered temporary bridges MUST gain a readable active treatment when they become solid, magnetic platforms MUST shift from dormant to powered support when their linked activation node fires, and gravity capsule buttons and shell cues MUST read as dormant versus enabled gate state without implying free-standing solid support. These state cues MUST remain local to the activator or governed route, MUST reset consistently on fresh attempts or retry events, and MUST NOT introduce a generalized puzzle HUD, screen-space prompt, or global room-state presentation.

#### Scenario: Activating a temporary bridge route
- **WHEN** the player enters a scanner volume that enables a temporary bridge
- **THEN** the bridge becomes visually readable as active support on that same update
- **AND** the cue remains local to the bridge and linked scanner relationship

#### Scenario: Powering a magnetic route
- **WHEN** the player triggers an activation node linked to a dormant magnetic platform
- **THEN** the node and platform both shift to a readable powered route state on that same update

#### Scenario: Enabling a gravity capsule section
- **WHEN** the player activates a gravity capsule section's linked button
- **THEN** the button and capsule shell read as an enabled gate state
- **AND** the field interior reads as an active gravity modifier rather than a newly spawned solid platform