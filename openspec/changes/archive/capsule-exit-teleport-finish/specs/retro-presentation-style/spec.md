## MODIFIED Requirements

### Requirement: Short-lived effects remain secondary to route readability
The game SHALL use low-frame animation, short tweens, and bounded particles as supporting retro presentation accents rather than as dominant spectacle. Event-driven effects for player actions, checkpoints, research samples, power gain, exit completion, enemy telegraphs, enemy defeat, and player defeat MUST stay short-lived, palette-bounded, and spatially local so they reinforce the playable state without hiding hazards, terrain edges, HUD text, or transition copy. Supported exit-completion feedback MUST render as a short capsule-entry teleport or dematerialization effect that stays local to the endpoint, keeps the multipart player readable through the start of the finish beat, and fully resolves before the normal completion-scene handoff. Supported defeat bursts for stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player defeat MUST render above the ordinary gameplay object stack so they remain clearly visible during live play, and their bounded particle count, spread, contrast, or lifetime MUST be strong enough to stay readable against busy stage art without changing defeat timing or respawn cadence. Supported defeat presentation MUST also keep the defeated victim visible at its last world position for a brief local hold of no more than 120 ms so a defeat flash or tween can read before that victim hides. The accompanying victim tween, flash, and explosion treatment MUST remain local and MUST fully resolve within 320 ms of the defeat trigger. Player defeat feedback MUST read as a brief blow-apart burst plus victim-side defeat tween that hands off cleanly into respawn, and enemy defeat feedback MUST read as a short disappearing-particle burst plus victim-side defeat tween that resolves locally around the defeated enemy. Stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player defeat MUST each use a distinct bounded visual treatment so the event class stays readable at a glance while preserving the same shared retro motion language. This shared motion language MUST continue to read as sprite-first retro presentation rather than modern smooth effects work.

#### Scenario: Reading gameplay during a local feedback burst
- **WHEN** the player triggers a jump, pickup, checkpoint, power gain, enemy telegraph accent, or defeat effect during active play
- **THEN** the effect remains spatially local and brief enough that nearby route-critical information stays readable
- **AND** the screen does not fill with persistent ambient particles or large overlapping effects

#### Scenario: Reading an exit teleport finish
- **WHEN** the player reaches a valid exit and the capsule-entry finish starts
- **THEN** the teleport or dematerialization effect stays centered on the exit endpoint and the player's last readable position
- **AND** the multipart player disappears cleanly within the short bounded finish window without obscuring nearby route-critical geometry

#### Scenario: Reading a player defeat burst
- **WHEN** the player dies during active play
- **THEN** the blow-apart effect stays centered on the player's last position, keeps the player briefly visible for the bounded defeat tween window, renders clearly above ordinary gameplay objects, and remains brief enough to hand off cleanly into the existing respawn flow

#### Scenario: Comparing defeat classes
- **WHEN** the player observes a stomp kill, a Plasma Blaster projectile kill, and a player death during active play
- **THEN** each event class reads as a distinct bounded retro effect
- **AND** the effects still feel like members of the same restrained presentation family

#### Scenario: Comparing retro accents to modern effects styling
- **WHEN** the updated presentation is evaluated during gameplay or transitions
- **THEN** the added motion still reads as restrained retro pose or accent work
- **AND** it does not rely on long easing chains, screen-filling blooms, or other dominant modern visual treatments

#### Scenario: Repeating the same event class
- **WHEN** the same supported event class happens repeatedly under the same conditions
- **THEN** the same class of bounded visual feedback is used consistently
- **AND** that consistency does not require constant continuous emission between event triggers

#### Scenario: Reading defeat particles in a mixed encounter
- **WHEN** a supported defeat burst happens while other enemies, hazards, terrain props, or projectiles remain active nearby
- **THEN** the burst remains clearly visible above ordinary gameplay objects
- **AND** it stays bounded enough that the still-active route and threats remain readable

#### Scenario: Reading the victim-side defeat cue before hide
- **WHEN** a supported enemy or player defeat triggers during active play
- **THEN** the defeated victim stays visible briefly at the defeat position so a local flash or tween can read before hide cleanup
- **AND** the total victim-side defeat presentation still resolves within the short bounded defeat window