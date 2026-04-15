## MODIFIED Requirements

### Requirement: Short-lived effects remain secondary to route readability
The game SHALL use low-frame animation, short tweens, and bounded particles as supporting retro presentation accents rather than as dominant spectacle. Event-driven effects for player actions, checkpoints, research samples, power gain, enemy telegraphs, enemy defeat, and player defeat MUST stay short-lived, palette-bounded, and spatially local so they reinforce the playable state without hiding hazards, terrain edges, HUD text, or transition copy. Player defeat feedback MUST read as a brief blow-apart burst that hands off cleanly into respawn, and enemy defeat feedback MUST read as a short disappearing-particle burst that resolves locally around the defeated enemy. Stomp enemy defeats, Plasma Blaster projectile enemy defeats, and player defeat MUST each use a distinct bounded visual treatment so the event class stays readable at a glance while preserving the same shared retro motion language. This shared motion language MUST continue to read as sprite-first retro presentation rather than modern smooth effects work.

#### Scenario: Reading gameplay during a local feedback burst
- **WHEN** the player triggers a jump, pickup, checkpoint, power gain, enemy telegraph accent, or defeat effect during active play
- **THEN** the effect remains spatially local and brief enough that nearby route-critical information stays readable
- **AND** the screen does not fill with persistent ambient particles or large overlapping effects

#### Scenario: Reading a player defeat burst
- **WHEN** the player dies during active play
- **THEN** the blow-apart effect stays centered on the player's last position and remains brief enough to hand off cleanly into the existing respawn flow

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