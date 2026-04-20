# player-power-visual-variants Specification

## Purpose
Define how the player avatar changes visually across supported powers while preserving readability and gameplay behavior.
## Requirements
### Requirement: Each supported power changes the player's presentation
The game SHALL present the default player as an original astronaut-themed base variant with a more human-like retro silhouette and SHALL apply a distinct astronaut-suit visual variant for each supported active power. Under this denser 8-bit gameplay pass, the base variant and each supported power variant MUST use readable sprite-like pixel detail, flat fills, and a tightly bounded concurrent color vocabulary rather than the current overly coarse rendering. The astronaut presentation MUST read as an upright human-like figure through visible helmet, torso, limb, boot, or backpack segmentation rather than as a mostly rectangular block stack, but it MUST preserve the existing gameplay hitbox and collision semantics. Each power variant MUST align with its player-facing display name: `Thruster Burst`, `Plasma Blaster`, `Shield Field`, and `Booster Dash`. Each supported power MUST remain readable at gameplay scale through a distinct silhouette cue, accent placement, visor or suit detail, or other clearly visible shape treatment rather than only a subtle hue swap or added noise. When the power is cleared, the player SHALL return to the base astronaut presentation. Increasing visual detail MUST NOT change any power mechanic, duration, or control behavior. The refreshed astronaut art MUST be original work informed by the provided reference only as style direction and MUST NOT directly copy, trace, or reproduce the reference image.

#### Scenario: Viewing the base astronaut during active play
- **WHEN** the player views the default unpowered avatar in a stage
- **THEN** the avatar reads as a more human-like retro astronaut with clear helmet, torso, and limb structure
- **AND** the updated silhouette does not change the player's gameplay footprint

#### Scenario: Gaining a supported power
- **WHEN** the player gains a supported block-granted power
- **THEN** the player switches to the matching astronaut-themed power variant in the denser 8-bit style

#### Scenario: Comparing power variants
- **WHEN** the player has different supported powers active in separate runs
- **THEN** each power presents a clearly distinct astronaut-themed look that remains differentiable despite the limited palette

#### Scenario: Reading a power state during active play
- **WHEN** the player views their current avatar while moving through a stage
- **THEN** the active power state is identifiable through visible silhouette or accent detail that does not depend on fine subpixel texture or only a hue change

#### Scenario: Clearing a power
- **WHEN** the player's active power is cleared
- **THEN** the player returns to the base astronaut presentation

#### Scenario: Adding detail without changing mechanics
- **WHEN** the denser 8-bit pass is applied to player power variants
- **THEN** any extra visual detail remains presentation-only and readable at gameplay scale
- **AND** the underlying power behavior and timing remain unchanged

#### Scenario: Treating the visual reference as inspiration only
- **WHEN** the refreshed astronaut presentation is evaluated against the supplied style reference
- **THEN** it reflects the intended human-like astronaut direction
- **AND** it does not directly reproduce the reference image

### Requirement: Player presentation uses bounded retro animation states
The game SHALL present the base astronaut variant and each supported power variant through a bounded set of readable retro animation states rather than a mostly static pose. At minimum, the player presentation MUST expose visually distinct grounded, moving, airborne, and defeat-to-respawn state changes, and power acquisition MAY add a brief matching accent pulse or burst so long as the active power variant remains readable at gameplay scale. These animation states MUST use low-frame pose swaps, restrained tween accents, or both rather than smooth modern smear motion, and they MUST NOT change player mechanics, timing, or collision. Any temporary defeat breakup or pose distortion applied to the astronaut during the death presentation MUST be fully cleared before the respawned player returns to active play.

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

#### Scenario: Restoring the astronaut after defeat
- **WHEN** the player respawns after the defeat animation has temporarily broken apart or distorted the avatar
- **THEN** the astronaut returns in a complete default or active-power presentation state
- **AND** no temporary defeat-only offsets, missing parts, or residual transforms remain visible

