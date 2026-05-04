# Player States Specification

## Purpose
Define explicit player lifecycle states for the platformer game, enabling structured state management, preventing impossible state combinations, and providing a foundation for future state-driven features (animation locking, audio state sync, replay systems).

## Requirements

### Requirement: Player has explicit lifecycle states
The game SHALL track the player's lifecycle using an explicit state machine with seven distinct states: **idle** (grounded, stationary), **run** (grounded, moving), **jump** (airborne after jump initiation), **fall** (airborne, descending), **dash** (active dash override), **hurt** (post-hit invulnerability), and **dead** (death presentation before respawn). The player MUST occupy exactly one of these states at any time. State transitions MUST be deterministic and based on well-defined events (input, collision, timers, health). The state machine MUST be implemented such that previously flat boolean flags (e.g., `player.dead`, `player.onGround`) remain accessible to existing code without modification through a backwards-compatible proxy interface.

#### Scenario: Player idle on platform
- **WHEN** the player is grounded and stationary with no movement input
- **THEN** the player occupies the **idle** state

#### Scenario: Player running on platform
- **WHEN** the player is grounded and receiving horizontal movement input
- **THEN** the player occupies the **run** state

#### Scenario: Player jumping after takeoff
- **WHEN** the player initiates a jump from valid ground support
- **THEN** the player enters the **jump** state (ascent phase + bounded pose-hold window)
- **AND** remains in jump state until apex is reached or jump-pose hold expires

#### Scenario: Player falling after jump peak
- **WHEN** the player's upward velocity becomes non-positive after jumping
- **THEN** the player transitions from **jump** to **fall** state
- **AND** remains in fall state while airborne

#### Scenario: Player dashing with input
- **WHEN** the player activates dash with valid cooldown
- **THEN** the player enters the **dash** state
- **AND** horizontal velocity is overridden with dash velocity
- **AND** remains in dash state for the dash duration

#### Scenario: Player takes damage while unpowered
- **WHEN** the player collides with a damaging threat and has no active protective powers
- **THEN** the player transitions to the **hurt** state
- **AND** health decreases
- **AND** player remains invulnerable during the hurt state invulnerability timer

#### Scenario: Player invulnerability window expires
- **WHEN** the invulnerability timer reaches zero while in hurt state
- **THEN** the player transitions out of **hurt** state to the appropriate grounded or airborne state

#### Scenario: Player reaches defeat condition
- **WHEN** the player's health reaches zero
- **THEN** the player enters the **dead** state
- **AND** remains non-controllable during the death presentation

#### Scenario: Player respawns after defeat
- **WHEN** the death presentation completes and respawn begins
- **THEN** the player transitions from **dead** state to **idle** state
- **AND** player control is restored at the respawn point

### Requirement: State transitions are guarded by conditions
The state machine MUST enforce guard conditions to prevent invalid transitions. Jump transitions MUST verify that valid jump eligibility exists (grounded, coyote time active, or double-jump available). Dash transitions MUST verify that dash cooldown is available and player is not already dashing. Transitions to grounded states MUST verify that collision with a supporting platform exists. Transitions MUST be evaluated deterministically each frame without race conditions or timing-dependent anomalies.

#### Scenario: Preventing jump when airborne without eligibility
- **WHEN** the player is airborne in fall state with no coyote time remaining and no double-jump available
- **THEN** jump input does not cause a state transition to jump

#### Scenario: Preventing dash during cooldown
- **WHEN** dash cooldown is still active
- **THEN** dash input does not cause a state transition to dash

#### Scenario: Preventing invalid grounded transitions during airborne
- **WHEN** the player is airborne and not in contact with a supporting platform
- **THEN** transitions to idle or run states do not occur

### Requirement: State machine state is backwards-compatible with existing player boolean flags
Existing game code that reads `player.dead` or `player.onGround` MUST continue to work without modification. The proxy interface MUST transparently map these boolean reads to state machine queries: `player.dead` MUST return the result of `machine.matches('dead')`, and `player.onGround` MUST return true when the machine matches either **idle** or **run** states. Write operations to `PlayerState` properties MUST continue to work normally. The backwards-compatible interface MUST incur no measurable serialization overhead and MUST not change save/load behavior.

#### Scenario: Reading dead flag via backwards-compat proxy
- **WHEN** existing code reads `player.dead`
- **THEN** the proxy returns `true` if machine state is **dead**, `false` otherwise
- **AND** no exceptions are raised

#### Scenario: Reading onGround flag via backwards-compat proxy
- **WHEN** existing code reads `player.onGround`
- **THEN** the proxy returns `true` if machine state matches **idle** or **run**, `false` otherwise
- **AND** no exceptions are raised

#### Scenario: Writing to player properties
- **WHEN** existing code writes to `player.vx`, `player.vy`, `player.x`, `player.y`, or timer fields
- **THEN** the write completes normally and the value is updated as expected
- **AND** the proxy does not interfere with write operations
