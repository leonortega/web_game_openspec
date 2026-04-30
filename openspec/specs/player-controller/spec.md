# player-controller Specification

## Purpose
TBD - created by archiving change mvp-platform-game. Update Purpose after archive.
## Requirements
### Requirement: Player can move and jump precisely
The game SHALL provide a player-controlled character that can run left and right, jump, and adjust position in the air with responsive platformer controls. The controller MUST include a forgiving jump window after leaving a platform and a buffered jump input shortly before landing. While the player is still supported by a falling platform's top surface, that support MUST remain valid for normal movement and jump initiation, including falling platforms that are in contact-aware collapse timing states before or after arm. Falling-platform arming and collapse timing MUST use deterministic contact-pattern thresholds (`stayArmThresholdMs = 120`, `hopGapThresholdMs = 50`) without invalidating grounded jump eligibility during active support contact. Jump readability MAY use a short bounded jump-pose hold window that keeps jump intent visible immediately after jump initiation, including brief airborne transitions after takeoff, as long as that hold remains presentation-level and does not alter jump physics, coyote timing, buffered-jump timing, dash priority, or support-contact truth.

#### Scenario: Jumping during contact-aware falling-platform timing
- **WHEN** the player is in valid top-surface support contact with a falling platform while that platform is accumulating pre-arm stay time or consuming armed collapse time
- **THEN** jump initiation remains valid under normal controller jump rules

#### Scenario: Holding jump-readability pose after takeoff
- **WHEN** the player initiates a jump from valid support
- **THEN** a short bounded jump-pose hold may remain visible immediately after takeoff to preserve readability
- **AND** controller physics and input windows remain unchanged



### Requirement: Support-detach frames preserve occupied fall position
The game SHALL preserve the player's occupied position on the single update where authored support motion ends valid top-surface contact without a player-initiated jump. On that detach update, collision resolution MUST ignore only the former support body for horizontal blocking if that body was the immediately preceding valid support and only if the player is leaving its top surface because the support moved away. All other solid bodies, including nearby walls and platforms, MUST still resolve normally on that update. The exemption MUST expire immediately after that update and MUST NOT alter jump initiation, coyote time, buffered jump resolution, dash motion, gravity-field behavior, or falling-platform support retention while top-surface contact remains valid. Contact-aware falling-platform timing thresholds MUST NOT broaden or weaken this single-update exemption.

#### Scenario: Detaching from support after contact-aware falling timing
- **WHEN** authored support motion clears a falling platform away from under the player's occupied footprint after any contact-aware arm/timer state transitions
- **THEN** the player begins airborne motion from the same occupied position on that detach update
- **AND** only the immediately former support is exempt from horizontal blocking on that one update
- **AND** other solids still block normally



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

### Requirement: Player can defeat eligible enemies with boot-thruster propulsion impact
The game SHALL allow the player to defeat eligible non-turret enemies from above only through an active airborne boot-thruster pulse impact rather than passive stomp contact. The player MUST trigger a downward thruster pulse while airborne to open a short impact window. Thruster pulse usage MUST consume bounded airborne fuel and MUST respect a per-pulse cooldown. Airborne thruster fuel MUST refresh on grounded recovery. Falling onto an enemy from above without an active thruster-impact window MUST NOT defeat that enemy.

#### Scenario: Successful thruster-impact defeat
- **WHEN** the player is airborne, triggers a downward thruster pulse, and collides from above with an eligible enemy during the active impact window
- **THEN** that enemy is defeated
- **AND** the player remains in active play with a bounded rebound outcome

#### Scenario: Falling contact without active thruster pulse
- **WHEN** the player collides from above with an eligible enemy without an active thruster-impact window
- **THEN** the enemy is not defeated by that contact

#### Scenario: Exhausted fuel or active cooldown
- **WHEN** the player attempts to trigger another airborne thruster pulse with no remaining pulse fuel or while cooldown is still active
- **THEN** no new pulse is triggered until fuel and cooldown rules permit it

#### Scenario: Grounded fuel refresh
- **WHEN** the player returns to grounded support after airborne traversal
- **THEN** the thruster pulse fuel pool refreshes for the next airborne sequence

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
The game SHALL apply active enclosed gravity room sections as a gating layer on top of the current anti-grav-stream and gravity-inversion controller rules without broadening into a global movement rewrite. An enclosed gravity room section that has not yet been disabled MUST continue applying its room-specific airborne acceleration anywhere inside the room's interior play volume. While that room field is still active, player jump initiation from valid support inside that room MUST use a room-scoped inverse takeoff instead of the normal upward takeoff. Buffered jump resolution and coyote-time jump resolution sourced from that same active room support MUST follow the same inverse takeoff rule. Double jump, launcher, and dash initiation rules MUST otherwise remain unchanged, and the room-specific airborne acceleration MUST continue after the inverse takeoff has begun. Once the linked interior disable button has been triggered, that room section MUST leave the player's grounded jump, buffered jump, coyote jump, fall, dash, launcher impulse, and grounded movement behavior unchanged until the next reset event. Normal gravity and normal jump semantics MUST resume immediately when the player leaves an active room interior or when that room has been disabled. Enemies inside or outside enclosed gravity rooms MUST keep their normal enemy movement and gravity behavior regardless of the room field state. This controller contract MUST apply consistently across every current playable stage's enclosed gravity room rollout, including rooms that replace formerly open anti-grav and inversion sections.

#### Scenario: Jumping through an active enclosed gravity room section
- **WHEN** the player initiates a grounded, buffered, or coyote-time jump from valid support inside an enclosed gravity room before its linked disable button has been triggered
- **THEN** the jump begins with the room-scoped inverse takeoff instead of the normal upward takeoff
- **AND** the room-specific airborne acceleration applies only after that takeoff has begun and only while the player remains inside the room interior

#### Scenario: Reaching the disable button while room gravity is active
- **WHEN** the player follows the intended route inside an active enclosed gravity room toward its linked interior disable button
- **THEN** the player can still use the room's inverse jump semantics and existing contact rules to gain eligible button contact before the room is disabled
- **AND** the room does not require a new interact input, jump-triggered gravity shutdown, or compliance-only support piece for that reach

#### Scenario: Reading jump takeoff inside an active enclosed gravity room
- **WHEN** the player initiates a jump from valid support inside an active enclosed gravity room
- **THEN** the jump begins with a readable inverse takeoff from that support rather than the normal upward jump
- **AND** the room's linked anti-grav or inversion effect continues bending the airborne arc after takeoff instead of replacing the room jump rule itself

#### Scenario: Jumping through a disabled enclosed gravity room section
- **WHEN** the player jumps or falls through an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the player's airborne arc follows the surrounding normal gravity rule with no room-specific acceleration applied anywhere in that room interior
- **AND** supported jump initiation inside that disabled room uses the normal upward takeoff again

#### Scenario: Enemy motion inside an enclosed gravity room
- **WHEN** an enemy moves or becomes airborne inside an enclosed gravity room while the room field is active or disabled
- **THEN** that enemy keeps its normal enemy gravity and movement behavior
- **AND** the room-specific gravity rule still applies only to the player

#### Scenario: Dashing through an active enclosed gravity room section
- **WHEN** the player dashes through an enclosed gravity room section while dash motion still overrides airborne movement
- **THEN** the dash keeps its normal motion while active
- **AND** the room-specific airborne acceleration resumes only after dash no longer overrides airborne movement

### Requirement: Broad helper falling-platform jump coverage matches controller truth
The project SHALL keep broad automated `Mechanic Checks` coverage for falling-platform jump behavior aligned with the current shipped controller contract. When the helper evaluates a falling-platform jump, it MUST treat top-surface contact on the falling platform as valid support for jump initiation, including escape jumps that begin while the player is still inside a gravity inversion column. The helper MUST derive its jump-input sequencing and pass criteria from the same controller truth already exercised by runtime coverage, and it MUST NOT fail solely because it still assumes an older helper-side jump timing model.

#### Scenario: Checking an escape jump from a falling platform
- **WHEN** broad automated coverage evaluates an escape jump that starts from valid falling-platform top-surface contact inside a gravity inversion column
- **THEN** it accepts the probe only if the jump initiation and post-takeoff gravity behavior match the shipped controller contract already covered by runtime tests

