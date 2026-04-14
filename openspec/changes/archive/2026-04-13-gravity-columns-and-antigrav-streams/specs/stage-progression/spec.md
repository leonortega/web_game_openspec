## ADDED Requirements

### Requirement: Gravity-field traversal stays stateless, bounded, and respawn-safe
The game SHALL treat gravity inversion columns and anti-grav streams as always-authored traversal geometry rather than as discovered, timed, or checkpoint-persistent route state. Every gravity field MUST begin each fresh attempt in its authored always-on baseline with no activation, cooldown, or saved traversal state. Checkpoint respawn and manual restart MUST rebuild gravity-field behavior solely from authored geometry and the player's restored position. Checkpoints used near gravity-field sections MUST place the player on stable support outside immediate forced field motion, and authored validation plus scripted playtest coverage MUST confirm that the Halo Spire Array sky rollout remains readable, completable, and reset-consistent after respawn or restart.

#### Scenario: Respawning near a gravity-field section
- **WHEN** the player dies after using an authored gravity inversion column or anti-grav stream and respawns from a checkpoint in that stage
- **THEN** the field behavior resumes from its always-on authored baseline without any preserved activation or temporary state

#### Scenario: Starting a fresh attempt after prior field use
- **WHEN** the player restarts the stage or begins a fresh attempt after previously traversing a gravity-field route
- **THEN** every gravity inversion column and anti-grav stream behaves exactly as authored with no carried-over runtime state

#### Scenario: Activating a checkpoint near a gravity-field route
- **WHEN** the player reaches a checkpoint associated with a gravity-field traversal section
- **THEN** the checkpoint stands on stable support and does not respawn the player into immediate forced airborne field motion

#### Scenario: Validating the bounded rollout
- **WHEN** authored validation or scripted playtest coverage evaluates the Halo Spire Array sky route that uses gravity fields
- **THEN** it accepts the route only if the section remains readable, completable, and bounded to the intended stage-authored rollout