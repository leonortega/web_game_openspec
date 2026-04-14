## ADDED Requirements

### Requirement: Activation-node magnetic platform state resets on respawn and fresh attempts
The game SHALL treat activation-node magnetic platforms as live traversal power state rather than checkpoint-persistent route discovery. Every activation node and linked magnetic platform MUST start inactive, visibly dormant, and non-solid on a fresh attempt. Death, checkpoint respawn, and manual stage restart MUST rebuild activation-node and magnetic-platform state from that dormant baseline instead of preserving prior powered state. A checkpoint snapshot MUST NOT restore a previously powered magnetic platform, even if the checkpoint was activated after its linked node had already been triggered. Stages that use this mechanic MUST remain safely completable when the powered route is skipped or resets on retry, either because the magnetic route is optional or because the activation node can be re-encountered before the route is required again.

#### Scenario: Dying after powering a magnetic platform
- **WHEN** the player triggers an activation node, powers its linked magnetic platform, and then dies before finishing the route
- **THEN** the next life restores the node and platform to their dormant, non-solid baseline until retriggered

#### Scenario: Respawning from a later checkpoint after platform activation
- **WHEN** the player powers a magnetic platform, later reaches a checkpoint, and then dies afterward in the same stage
- **THEN** respawning from that checkpoint does not preserve the powered state and requires the route to follow its authored retry-safe behavior

#### Scenario: Starting a fresh attempt after prior magnetic-route use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously activating a magnetic platform
- **THEN** every activation node and linked magnetic platform starts again from its dormant and unpowered baseline

#### Scenario: Authoring a retry-safe magnetic route
- **WHEN** a stage defines a route that uses an activation-node magnetic platform
- **THEN** authored validation or scripted coverage accepts it only if the stage remains safely completable when that powered route is unavailable until retriggered