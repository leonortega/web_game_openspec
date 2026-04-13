# player-controller Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. Low gravity MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, spring-launch, biome-launcher, or dash impulse values. While the player is grounded on authored sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed, and a grounded jump or coyote jump sourced from that sludge support MUST use a reduced jump launch impulse. Sticky sludge MUST preserve jump buffering and coyote timing rules, MUST NOT damp spring-launch, biome-launcher, or dash impulses, and MUST compose with low gravity by changing only the jump impulse before the low-gravity airborne arc rule takes effect. Authored bounce pods and gas vents MUST trigger only on the first eligible ready-contact update, MUST apply their launch impulse on that update before low-gravity airborne adjustment begins, and MUST use the same jump-hold suppression rule as springs. If jump input is already held, or a buffered jump resolves, on that launcher-contact update, the launcher MUST not auto-launch for that contact and the controller MUST continue with the normal grounded jump or support resolution instead. An active dash MUST NOT be interrupted by launcher contact, and a launcher MUST NOT retroactively fire later during the same uninterrupted contact after dash contact or suppression.

#### Scenario: Running on solid ground
- **WHEN** the player holds a movement input on stable ground
- **THEN** the character moves horizontally in that direction with predictable acceleration and deceleration

#### Scenario: Running on sticky sludge
- **WHEN** the player holds a movement input while grounded on sticky sludge
- **THEN** the character accelerates more slowly and reaches a lower grounded top speed than on stable normal ground

#### Scenario: Jumping from a platform edge
- **WHEN** the player presses jump shortly after walking off a platform
- **THEN** the character still performs a valid jump

#### Scenario: Jumping from sticky sludge coyote time
- **WHEN** the player presses jump during coyote time immediately after leaving sticky sludge support
- **THEN** the controller performs a valid jump using the sticky-sludge jump impulse for that takeoff

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

#### Scenario: Buffering a jump onto sticky sludge
- **WHEN** a buffered jump resolves on the frame the player lands on sticky sludge
- **THEN** the character jumps immediately using the sticky-sludge jump impulse

#### Scenario: Jumping from a falling platform
- **WHEN** the player is still in contact with the top of a falling platform and presses jump
- **THEN** the controller performs a normal jump rather than dropping the player out of jumpable support early

#### Scenario: Jumping inside a low-gravity zone
- **WHEN** the player jumps or double jumps while inside an authored low-gravity zone
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining ascent and descent use the reduced vertical acceleration from that zone

#### Scenario: Jumping from sticky sludge inside a low-gravity zone
- **WHEN** the player initiates a grounded jump from sticky sludge while inside an authored low-gravity zone
- **THEN** the jump starts with the reduced sticky-sludge jump impulse
- **AND** the remaining ascent and descent use the reduced vertical acceleration from that zone

#### Scenario: Dashing through a low-gravity zone
- **WHEN** the player dashes while entering, leaving, or crossing a low-gravity zone
- **THEN** the dash keeps its normal dash motion while active
- **AND** the low-gravity acceleration rule resumes only after the dash no longer overrides airborne motion

#### Scenario: Dashing through sticky sludge
- **WHEN** the player dashes while entering, leaving, or crossing sticky sludge
- **THEN** the dash keeps its normal dash motion while active
- **AND** any sticky-sludge grounded penalties resume only after the dash no longer overrides movement and the player is grounded on sludge again

#### Scenario: Launching from a spring in a low-gravity zone
- **WHEN** a spring launches the player while the player is inside a low-gravity zone
- **THEN** the spring applies its normal launch impulse first
- **AND** the zone stretches the resulting airborne arc only after that launch begins

#### Scenario: Launching from a spring on sticky sludge
- **WHEN** a spring launches the player from sticky sludge support
- **THEN** the spring applies its normal launch impulse rather than a sludge-reduced jump impulse

#### Scenario: Launching from a biome launcher in a low-gravity zone
- **WHEN** a bounce pod or gas vent launches the player while the player is inside a low-gravity zone
- **THEN** the launcher applies its authored launch impulse first
- **AND** the zone stretches the resulting airborne arc only after that launch begins

#### Scenario: Launching from a biome launcher on sticky sludge
- **WHEN** a bounce pod or gas vent launches the player from sticky sludge support
- **THEN** the launcher applies its normal authored launch impulse rather than a sludge-reduced jump impulse

#### Scenario: Suppressing a launcher by holding jump
- **WHEN** the player first contacts a ready bounce pod or gas vent while jump is already held
- **THEN** the launcher does not auto-launch on that contact
- **AND** the player keeps normal grounded jump and support behavior for that landing

#### Scenario: Resolving a buffered jump on a launcher
- **WHEN** a buffered jump resolves on the frame the player first lands on a ready bounce pod or gas vent
- **THEN** the buffered jump takes priority for that contact
- **AND** the launcher does not auto-launch until a later eligible new contact

#### Scenario: Dashing onto a ready launcher
- **WHEN** the player contacts a ready bounce pod or gas vent while dash still overrides movement
- **THEN** the dash continues without interruption
- **AND** the launcher does not fire later unless the player creates a new eligible contact after dash no longer overrides motion

#### Scenario: Escaping a falling platform through low gravity
- **WHEN** the player escape-jumps from a falling platform while still inside a low-gravity zone
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** low gravity affects only the airborne arc after the jump has started

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

