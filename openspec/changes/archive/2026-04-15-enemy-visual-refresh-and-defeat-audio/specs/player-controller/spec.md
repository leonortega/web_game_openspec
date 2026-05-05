## MODIFIED Requirements

### Requirement: Player can take damage and recover through respawn
The game SHALL track player health or hit state, apply damage from enemies and hazards, and return the player to active play through death and respawn rules. When the player collides with a damaging enemy or hazard while one or more active non-invincible powers are present and invincibility is not active, the game MUST clear those active non-invincible powers and MUST NOT reduce health for that hit. When invincibility is active, damaging contact MUST preserve invincibility until its timer expires, MUST keep health unchanged for that hit, and MUST still clear any other active non-invincible powers. When the player has no active powers, damaging contact MUST reduce health as normal. When the player reaches the defeat condition, the game MUST enter a short non-controllable death presentation state that emits a bounded blow-apart particle burst from the player's last position before respawning at the most recently activated checkpoint or level start. That defeat presentation MUST keep the player visible for a brief bounded defeat-flash window of no more than 120 ms, MUST play a local victim-side defeat tween or flash before the sprite hides, MUST stay local, deterministic, and clearly visible above ordinary gameplay objects, MUST remain visually distinct from stomp and Plasma Blaster enemy-defeat bursts, MUST preserve the existing respawn point and timing semantics, MAY temporarily break apart or distort the player's presentation for effect, and MUST remain short enough to preserve the current respawn flow without changing damage immunity rules, checkpoint semantics, or which respawn point is selected. The defeat transition MUST also trigger one dedicated fatal-death audio event that remains distinct from survivable damage and enemy-defeat cues without changing when respawn begins. Before the respawned player returns to active play, the game MUST restore the full player visual composition, including all body parts, pose offsets, alpha, tint, scale, rotation, visibility, and active-power presentation details, so the avatar never appears broken after respawn.

#### Scenario: Taking damage from a threat while unpowered
- **WHEN** the player collides with a damaging enemy or hazard and has no active powers
- **THEN** the game applies damage or loss of health to the player

#### Scenario: Consuming non-invincible powers on a protected hit
- **WHEN** the player collides with a damaging enemy or hazard while active non-invincible powers are present and invincibility is not active
- **THEN** the game clears those active non-invincible powers and does not remove health for that hit

#### Scenario: Retaining invincibility on damaging contact
- **WHEN** the player collides with a damaging enemy or hazard while invincibility is active
- **THEN** the game keeps invincibility active for its remaining timer and does not remove health for that hit

#### Scenario: Clearing other powers while invincible
- **WHEN** the player collides with a damaging enemy or hazard while invincibility and another active power are both present
- **THEN** the game preserves invincibility and clears the other active power states for that hit

#### Scenario: Losing all health
- **WHEN** the player reaches the defeat condition
- **THEN** the game triggers a death state, keeps the player briefly visible for the bounded defeat tween window, plays the bounded blow-apart defeat presentation above ordinary gameplay objects, and then restarts the player from the current respawn point

#### Scenario: Distinguishing player defeat from enemy defeat
- **WHEN** the player sees a player death and an enemy defeat during active play
- **THEN** the player-death presentation remains visually distinct from stomp and Plasma Blaster enemy-defeat feedback
- **AND** the underlying respawn selection and timing stay unchanged

#### Scenario: Respawning from a checkpoint
- **WHEN** the player has activated a checkpoint before dying
- **THEN** the player respawns at that checkpoint instead of the stage start

#### Scenario: Losing powers after death
- **WHEN** the player dies after taking damage
- **THEN** the game clears the player's active powers

#### Scenario: Holding the player sprite without delaying respawn flow
- **WHEN** the player death presentation begins
- **THEN** the player remains non-controllable while the brief defeat flash or tween plays before hide
- **AND** the short visible hold does not change the existing respawn cadence

#### Scenario: Triggering the fatal-death audio event
- **WHEN** the player enters the fatal death transition after losing the last remaining health
- **THEN** the game emits the dedicated death-audio event once for that defeat
- **AND** the event does not delay or duplicate the existing respawn handoff

#### Scenario: Restoring the full avatar on respawn
- **WHEN** the player respawns after any defeat presentation state
- **THEN** the player returns with a complete intact avatar in the correct base or active-power visual variant
- **AND** no defeat-only visual mutations remain on the respawned player