## ADDED Requirements

### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing.

#### Scenario: Running on solid ground
- **WHEN** the player holds a movement input on stable ground
- **THEN** the character moves horizontally in that direction with predictable acceleration and deceleration

#### Scenario: Jumping from a platform edge
- **WHEN** the player presses jump shortly after walking off a platform
- **THEN** the character still performs a valid jump

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

### Requirement: Player can take damage and recover through respawn
The game SHALL track player health or hit state, apply damage from enemies and hazards, and return the player to active play through death and respawn rules. The respawn flow MUST place the player at the most recently activated checkpoint or level start.

#### Scenario: Taking damage from a threat
- **WHEN** the player collides with a damaging enemy or hazard
- **THEN** the game applies damage or loss of health to the player

#### Scenario: Losing all health
- **WHEN** the player reaches the defeat condition
- **THEN** the game triggers a death state and restarts the player from the current respawn point

#### Scenario: Respawning from a checkpoint
- **WHEN** the player has activated a checkpoint before dying
- **THEN** the player respawns at that checkpoint instead of the stage start

### Requirement: Player can defeat eligible enemies by stomping
The game SHALL allow the player to defeat stompable enemy types by landing on them from above while falling.

#### Scenario: Successful stomp
- **WHEN** the player lands on a stompable enemy from above
- **THEN** the enemy is defeated and the player remains in active play

#### Scenario: Side collision with stompable enemy
- **WHEN** the player collides with the same enemy from the side or below
- **THEN** the player takes damage instead of defeating the enemy
