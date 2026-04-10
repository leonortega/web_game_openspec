# player-controller Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation.

#### Scenario: Running on solid ground
- **WHEN** the player holds a movement input on stable ground
- **THEN** the character moves horizontally in that direction with predictable acceleration and deceleration

#### Scenario: Jumping from a platform edge
- **WHEN** the player presses jump shortly after walking off a platform
- **THEN** the character still performs a valid jump

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

#### Scenario: Jumping from a falling platform
- **WHEN** the player is still in contact with the top of a falling platform and presses jump
- **THEN** the controller performs a normal jump rather than dropping the player out of jumpable support early

### Requirement: Player can take damage and recover through respawn
The game SHALL track player health or hit state, apply damage from enemies and hazards, and return the player to active play through death and respawn rules. When the player collides with a damaging enemy or hazard while one or more active non-invincible powers are present and invincibility is not active, the game MUST clear those active non-invincible powers and MUST NOT reduce health for that hit. When invincibility is active, damaging contact MUST preserve invincibility until its timer expires, MUST keep health unchanged for that hit, and MUST still clear any other active non-invincible powers. When the player has no active powers, damaging contact MUST reduce health as normal. The respawn flow MUST place the player at the most recently activated checkpoint or level start.

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
- **THEN** the game triggers a death state and restarts the player from the current respawn point

#### Scenario: Respawning from a checkpoint
- **WHEN** the player has activated a checkpoint before dying
- **THEN** the player respawns at that checkpoint instead of the stage start

#### Scenario: Losing powers after death
- **WHEN** the player dies after taking damage
- **THEN** the game clears the player's active powers

### Requirement: Player can defeat eligible enemies by stomping
The game SHALL allow the player to defeat stompable enemy types by landing on them from above while falling.

#### Scenario: Successful stomp
- **WHEN** the player lands on a stompable enemy from above
- **THEN** the enemy is defeated and the player remains in active play

#### Scenario: Side collision with stompable enemy
- **WHEN** the player collides with the same enemy from the side or below
- **THEN** the player takes damage instead of defeating the enemy

### Requirement: Player abilities can expand the core moveset through progression
The game SHALL allow the player's base controller to be extended by interactive block rewards such as double jump, shooter, invincibility, and dash. Added powers MUST remain responsive and use consistent activation rules.

#### Scenario: Using an unlocked movement ability
- **WHEN** the player activates an authored power reward
- **THEN** the controller applies the expected movement or combat effect consistently

#### Scenario: Combining base movement and block-granted powers
- **WHEN** the player runs, jumps, and uses a block-granted power in sequence
- **THEN** the character remains controllable and responsive under the combined moveset

