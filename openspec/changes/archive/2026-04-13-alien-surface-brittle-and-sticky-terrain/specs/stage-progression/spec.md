## ADDED Requirements

### Requirement: Brittle crystal floor state resets with attempt and checkpoint recovery
The game SHALL treat brittle crystal floor breakage as live traversal state rather than checkpoint-persistent route discovery. Every brittle crystal floor MUST begin intact and solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST restore every brittle crystal floor to its intact untriggered state, regardless of whether the floor had already warned or broken earlier in that run. A checkpoint snapshot MUST NOT preserve a brittle floor's warned, broken, or partially expired state.

#### Scenario: Dying after breaking a brittle floor
- **WHEN** the player triggers and breaks a brittle crystal floor and then dies before finishing the route
- **THEN** the next life restores that floor as intact and untriggered

#### Scenario: Respawning from a later checkpoint after brittle-floor use
- **WHEN** the player breaks a brittle crystal floor and later dies after reaching a checkpoint
- **THEN** respawning from that checkpoint does not preserve the brittle floor's warned or broken state

#### Scenario: Starting a fresh attempt after prior brittle-floor use
- **WHEN** the player restarts the stage or begins a new attempt after previously triggering a brittle crystal floor
- **THEN** every brittle crystal floor starts again as intact and untriggered until top-surface contact triggers it

### Requirement: Authored terrain-surface metadata stays valid and verifiable
The game SHALL validate authored brittle crystal and sticky sludge surface metadata before runtime setup. Each authored surface annotation MUST use a supported surface kind, MUST define a positive bounded rectangular footprint, and MUST align to existing solid walkable stage support instead of floating independently. Brittle crystal floors MUST map to real supporting tiles so their warning, support, and break states remain readable. The authored surface extents used by simulation MUST match the extents rendered in-stage, and regression coverage MUST include at least one brittle-floor traversal fixture and one sticky-sludge traversal fixture in automated or scripted playtest coverage.

#### Scenario: Loading malformed terrain-surface metadata
- **WHEN** a stage contains an authored brittle or sticky surface with an unknown kind, invalid rectangle, or no valid supporting terrain
- **THEN** stage validation rejects that authored data before the stage is accepted for runtime use

#### Scenario: Loading valid terrain-surface metadata
- **WHEN** a stage contains valid authored brittle crystal and sticky sludge surface annotations
- **THEN** the stage accepts those annotations for both simulation and rendering using the same authored extents

#### Scenario: Running surface traversal regression coverage
- **WHEN** automated tests or scripted playtest coverage run for the new terrain surfaces
- **THEN** the suite exercises at least one brittle-floor route and one sticky-sludge route instead of relying only on manual inspection