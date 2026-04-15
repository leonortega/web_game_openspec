## ADDED Requirements

### Requirement: Player presentation uses bounded retro animation states
The game SHALL present the base astronaut variant and each supported power variant through a bounded set of readable retro animation states rather than a mostly static pose. At minimum, the player presentation MUST expose visually distinct grounded, moving, and airborne state changes, and power acquisition MAY add a brief matching accent pulse or burst so long as the active power variant remains readable at gameplay scale. These animation states MUST use low-frame pose swaps, restrained tween accents, or both rather than smooth modern smear motion, and they MUST NOT change player mechanics, timing, or collision.

#### Scenario: Reading the active player state while moving
- **WHEN** the player runs, idles, jumps, or falls during active play
- **THEN** the avatar changes pose or bounded accent state enough to communicate the current movement state
- **AND** that motion remains readable within the limited retro palette and gameplay scale

#### Scenario: Gaining a supported power with readable feedback
- **WHEN** the player gains a supported power
- **THEN** the avatar switches to the matching power variant and may play a brief matching gain accent
- **AND** the gain feedback does not obscure the power variant's ongoing readability once the moment passes

#### Scenario: Comparing animated power variants
- **WHEN** the player compares supported powers across separate runs
- **THEN** each supported power remains visually distinct through its bounded pose set, silhouette treatment, accent placement, or gain feedback language
- **AND** those distinctions do not depend only on a subtle hue shift

#### Scenario: Clearing or losing a power
- **WHEN** the player's active power is cleared or consumed
- **THEN** the player returns to the base astronaut presentation and its matching bounded animation states
- **AND** the transition back does not change control timing or hit behavior