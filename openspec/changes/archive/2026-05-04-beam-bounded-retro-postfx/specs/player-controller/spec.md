## MODIFIED Requirements

### Requirement: Player can take damage and recover through respawn
The game SHALL track player health or hit state, apply damage from enemies and hazards, and return the player to active play through death and respawn rules. When the player collides with a damaging enemy or hazard while one or more active non-invincible powers are present and invincibility is not active, the game MUST clear those active non-invincible powers and MUST NOT reduce health for that hit. When invincibility is active, damaging contact MUST preserve invincibility until its timer expires, MUST keep health unchanged for that hit, and MUST still clear any other active non-invincible powers. When the player has no active powers, damaging contact MUST reduce health as normal. Any surviving damaging contact or power-consuming protected hit MAY trigger one short object-local player hit flash so long as that flash remains readable over the current base or powered player presentation and does not change damage resolution, invincibility timing, or control behavior. When the player reaches the defeat condition, the game MUST enter a short non-controllable death presentation state that emits a bounded blow-apart particle burst from the player's last position before respawning at the most recently activated checkpoint or level start. That defeat presentation MUST keep the player visible for a brief bounded defeat-flash window of no more than 120 ms, MUST play a local victim-side defeat tween or flash before the sprite hides, MUST stay local, deterministic, and clearly visible above ordinary gameplay objects, MUST remain visually distinct from stomp and Plasma Blaster enemy-defeat bursts, MAY temporarily break apart or distort the player's presentation for effect, and MUST remain short enough to preserve the current respawn flow without changing damage immunity rules, checkpoint semantics, or which respawn point is selected. The defeat transition MUST also trigger one dedicated fatal-death audio event that remains distinct from survivable damage and enemy-defeat cues without changing when respawn begins. Before the respawned player returns to active play, the game MUST restore the full player visual composition, including all body parts, pose offsets, alpha, tint, scale, rotation, visibility, and active-power presentation details, so the avatar never appears broken after respawn.

#### Scenario: Taking survivable damage with a local hit flash
- **WHEN** the player takes a damaging or power-consuming protected hit and remains in active play
- **THEN** the game may play one short object-local player hit flash at the player body
- **AND** the flash does not change the existing damage, invincibility, or control semantics

#### Scenario: Losing all health
- **WHEN** the player reaches the defeat condition
- **THEN** the game triggers a death state, keeps the player briefly visible for the bounded defeat tween window, plays the bounded blow-apart defeat presentation above ordinary gameplay objects, and then restarts the player from the current respawn point

#### Scenario: Holding the player sprite without delaying respawn flow
- **WHEN** the player death presentation begins
- **THEN** the player remains non-controllable while the brief defeat flash or tween plays before hide
- **AND** the short visible hold does not change the existing respawn cadence