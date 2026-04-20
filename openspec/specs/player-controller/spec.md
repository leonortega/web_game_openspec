# player-controller Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation. When the player is inside an authored low-gravity zone, the controller MUST reduce only the player's ongoing vertical acceleration and MUST restore normal gravity immediately after the player exits the zone. When the player is inside an authored anti-grav stream, the controller MUST add only upward-biased ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the stream. When the player is inside an authored gravity inversion column, the controller MUST reverse only the player's ongoing airborne vertical acceleration and MUST restore normal gravity immediately after the player exits the column. Low gravity, anti-grav streams, and gravity inversion columns MUST modify the airborne arc after a movement impulse is applied rather than rewriting the initial jump, double-jump, spring-launch, biome-launcher, or dash impulse values. While the player is grounded on authored sticky sludge, the controller MUST use reduced grounded acceleration and reduced grounded maximum horizontal speed only. Sticky sludge MUST preserve grounded jump launch strength, jump buffering, coyote timing, spring-launch, biome-launcher, dash, and gravity-field composition rules instead of rewriting them. Authored bounce pods and gas vents MUST trigger only on the first eligible ready-contact update, MUST apply their launch impulse on that update before low-gravity, anti-grav-stream, or gravity-inversion airborne adjustment begins, and MUST use the same jump-hold suppression rule as springs. If jump input is already held, or a buffered jump resolves, on that launcher-contact update, the launcher MUST not auto-launch for that contact and the controller MUST continue with the normal grounded jump or support resolution instead. An active dash MUST NOT be interrupted by launcher contact, and a launcher MUST NOT retroactively fire later during the same uninterrupted contact after dash contact or suppression. An active dash MUST suppress low-gravity, anti-grav-stream, and gravity-inversion acceleration while dash motion still overrides airborne movement.

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
- **THEN** the controller performs a valid jump using the normal jump launch strength for that takeoff

#### Scenario: Buffering jump before landing
- **WHEN** the player presses jump shortly before touching the ground
- **THEN** the character jumps on landing without requiring a second input

#### Scenario: Buffering a jump onto sticky sludge
- **WHEN** a buffered jump resolves on the frame the player lands on sticky sludge
- **THEN** the character jumps immediately using the normal jump launch strength

#### Scenario: Jumping from a falling platform
- **WHEN** the player is still in contact with the top of a falling platform and presses jump
- **THEN** the controller performs a normal jump rather than dropping the player out of jumpable support early

#### Scenario: Jumping inside a low-gravity zone
- **WHEN** the player jumps or double jumps while inside an authored low-gravity zone
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining ascent and descent use the reduced vertical acceleration from that zone

#### Scenario: Jumping inside an anti-grav stream
- **WHEN** the player jumps or double jumps while inside an authored anti-grav stream
- **THEN** the jump or double-jump starts with the normal impulse
- **AND** the remaining airborne motion gains the stream's upward-biased acceleration only after that impulse begins

#### Scenario: Crossing a gravity inversion column while airborne
- **WHEN** the player is airborne and enters an authored gravity inversion column
- **THEN** the controller reverses only the ongoing airborne vertical acceleration while the player remains inside the column
- **AND** normal gravity resumes immediately after the player exits the column

#### Scenario: Jumping from sticky sludge inside an anti-grav stream
- **WHEN** the player initiates a grounded jump from sticky sludge while inside an authored anti-grav stream
- **THEN** the jump starts with the normal impulse
- **AND** the remaining airborne motion gains the stream's upward-biased acceleration only after that jump has started

#### Scenario: Dashing through an authored gravity field
- **WHEN** the player dashes while entering, leaving, or crossing a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the dash keeps its normal dash motion while active
- **AND** the field-specific airborne acceleration rule resumes only after the dash no longer overrides airborne motion

#### Scenario: Dashing through sticky sludge
- **WHEN** the player dashes while entering, leaving, or crossing sticky sludge
- **THEN** the dash keeps its normal dash motion while active
- **AND** any sticky-sludge grounded penalties resume only after the dash no longer overrides movement and the player is grounded on sludge again

#### Scenario: Launching from a spring in an authored gravity field
- **WHEN** a spring launches the player while the player is inside a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the spring applies its normal launch impulse first
- **AND** the field changes the resulting airborne arc only after that launch begins

#### Scenario: Launching from a spring on sticky sludge
- **WHEN** a spring launches the player from sticky sludge support
- **THEN** the spring applies its normal launch impulse rather than a sludge-reduced jump impulse

#### Scenario: Launching from a biome launcher in an authored gravity field
- **WHEN** a bounce pod or gas vent launches the player while the player is inside a low-gravity zone, anti-grav stream, or gravity inversion column
- **THEN** the launcher applies its authored launch impulse first
- **AND** the field changes the resulting airborne arc only after that launch begins

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

#### Scenario: Escaping a falling platform through a gravity inversion column
- **WHEN** the player escape-jumps from a falling platform while still inside a gravity inversion column
- **THEN** the falling platform support window remains valid for jump initiation
- **AND** the gravity inversion affects only the airborne arc after the jump has started

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

### Requirement: Controller events expose bounded movement and checkpoint feedback
The game SHALL attach readable event-based visual feedback to supported controller moments without changing controller behavior. Jump and double-jump initiation, grounded landing recovery, and survey-beacon checkpoint activation MUST be allowed to trigger short retro-styled motion accents or particles, but those effects MUST be driven by discrete gameplay events rather than continuous per-frame emission. The added feedback MUST NOT change jump buffering, coyote time, dash priority, checkpoint semantics, damage rules, or respawn behavior.

#### Scenario: Triggering jump feedback
- **WHEN** the player performs a supported jump or double jump
- **THEN** the game may emit a short takeoff accent or particle burst tied to that jump event
- **AND** the feedback does not change the jump's physics or input timing

#### Scenario: Triggering landing feedback
- **WHEN** the player lands from an airborne state onto valid support
- **THEN** the game may emit a short landing accent that communicates recovery or contact
- **AND** the effect remains event-based rather than repeating while the player stays grounded

#### Scenario: Activating a checkpoint
- **WHEN** the player activates a survey beacon checkpoint
- **THEN** the game plays a readable checkpoint pulse, burst, or equivalent bounded accent near that beacon event
- **AND** the activation feedback does not change respawn location, checkpoint persistence, or controller state timing

### Requirement: Gated gravity capsule sections preserve existing controller semantics
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without changing the underlying movement model. An enclosed gravity room section that has not yet been disabled MUST modify only the player's ongoing airborne vertical acceleration after the relevant jump, launcher, or dash-overridden motion rule has already been determined. Once the linked interior disable button has been triggered, that room section MUST leave the player's jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity MUST resume immediately when the player leaves an active room field or when that room has been disabled. This controller contract MUST apply consistently across every current playable stage's enclosed gravity room rollout, including rooms that replace formerly open anti-grav and inversion sections.

#### Scenario: Jumping through an active enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section before its linked disable button has been triggered
- **THEN** the player's initial jump or launcher impulse remains unchanged
- **AND** the room-specific airborne acceleration applies only after that impulse has begun and only while the player remains inside the active field bounds

#### Scenario: Jumping through a disabled enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no room-specific acceleration applied

#### Scenario: Dashing through an active enclosed gravity room section
- **WHEN** the player dashes through an enclosed gravity room section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the room-specific airborne acceleration resumes only after dash no longer overrides airborne movement

#### Scenario: Traversing multiple rolled-out gravity rooms across stages
- **WHEN** the player encounters enclosed gravity rooms in different current playable stages
- **THEN** each room uses the same controller composition rules without changing jump, dash, launcher, or grounded semantics between stages

