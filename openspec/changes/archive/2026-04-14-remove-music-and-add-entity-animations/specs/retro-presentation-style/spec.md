## ADDED Requirements

### Requirement: Short-lived effects remain secondary to route readability
The game SHALL use low-frame animation, short tweens, and bounded particles as supporting retro presentation accents rather than as dominant spectacle. Event-driven effects for player actions, checkpoints, research samples, power gain, and enemy telegraphs MUST stay short-lived, palette-bounded, and spatially local so they reinforce the playable state without hiding hazards, terrain edges, HUD text, or transition copy. This shared motion language MUST continue to read as sprite-first retro presentation rather than modern smooth effects work.

#### Scenario: Reading gameplay during a local feedback burst
- **WHEN** the player triggers a jump, pickup, checkpoint, power gain, or enemy telegraph accent during active play
- **THEN** the effect remains spatially local and brief enough that nearby route-critical information stays readable
- **AND** the screen does not fill with persistent ambient particles or large overlapping effects

#### Scenario: Comparing retro accents to modern effects styling
- **WHEN** the updated presentation is evaluated during gameplay or transitions
- **THEN** the added motion still reads as restrained retro pose or accent work
- **AND** it does not rely on long easing chains, screen-filling blooms, or other dominant modern visual treatments

#### Scenario: Repeating the same event class
- **WHEN** the same supported event class happens repeatedly under the same conditions
- **THEN** the same class of bounded visual feedback is used consistently
- **AND** that consistency does not require constant continuous emission between event triggers