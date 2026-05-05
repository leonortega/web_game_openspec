## MODIFIED Requirements

### Requirement: Player presentation uses bounded retro animation states
The game SHALL present the base astronaut variant and each supported power variant through a bounded set of readable retro animation states rather than a mostly static pose. At minimum, the player presentation MUST expose visually distinct grounded, moving, airborne, hit-react, and defeat-to-respawn state changes, and power acquisition MAY add a brief matching accent pulse or burst so long as the active power variant remains readable at gameplay scale. Supported player hit-react presentation MAY include one short object-local flash or Beam-assisted accent, but that accent MUST remain brief, MUST preserve the readability of the current base or powered astronaut variant underneath it, and MUST NOT change player mechanics, timing, or collision. These animation states MUST use low-frame pose swaps, restrained tween accents, or both rather than smooth modern smear motion. Any temporary defeat breakup, flash, or pose distortion applied to the astronaut during hit-react or death presentation MUST be fully cleared before the respawned or recovered player returns to active play.

#### Scenario: Reading a powered player through a hit flash
- **WHEN** the player takes a hit while a supported power variant is active
- **THEN** the short local hit flash still allows the current power variant to remain identifiable at gameplay scale
- **AND** the flash clears without leaving residual transforms or color treatment behind

#### Scenario: Restoring the astronaut after hit-react or defeat
- **WHEN** the player recovers from a survivable hit or respawns after defeat
- **THEN** the astronaut returns in a complete default or active-power presentation state
- **AND** no temporary hit-only or defeat-only visual mutations remain visible