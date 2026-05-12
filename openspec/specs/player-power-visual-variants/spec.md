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
The game SHALL present the base astronaut variant and each supported power variant through a bounded set of readable retro animation states rather than a mostly static pose. Under the chibi presentation contract, the player MUST keep a compact side-view astronaut silhouette with readable helmet/head mass, segmented torso-limb poses, and power-specific accents that remain clear at gameplay scale. At minimum, the player presentation MUST expose visually distinct grounded, moving, airborne, hit-react, and defeat-to-respawn state changes. The player sheet MUST stay within the existing 32x48 frame envelope and MUST use the frame-budget ranges defined in `art.md` for locomotion, action, hit-react, and defeat clips. Power acquisition MAY add a brief matching accent pulse or burst so long as the active power variant remains readable at gameplay scale. Supported player hit-react presentation MAY include one short object-local flash or Beam-assisted accent, but that accent MUST remain brief, MUST preserve the readability of the current base or powered astronaut variant underneath it, and MUST NOT change player mechanics, timing, or collision. These animation states MUST use low-frame pose swaps, restrained tween accents, or both rather than smooth modern smear motion. Any temporary defeat breakup, flash, or pose distortion applied to the astronaut during hit-react or death presentation MUST be fully cleared before the respawned or recovered player returns to active play.

#### Scenario: Reading a powered player through a hit flash
- **WHEN** the player takes a hit while a supported power variant is active
- **THEN** the short local hit flash still allows the current power variant to remain identifiable at gameplay scale
- **AND** the flash clears without leaving residual transforms or color treatment behind

#### Scenario: Restoring the astronaut after hit-react or defeat
- **WHEN** the player recovers from a survivable hit or respawns after defeat
- **THEN** the astronaut returns in a complete default or active-power presentation state
- **AND** no temporary hit-only or defeat-only visual mutations remain visible

#### Scenario: Respecting player frame budgets
- **WHEN** player clips are authored or revised for richer motion
- **THEN** each state remains within the min/max frame ranges listed in `art.md`
- **AND** the player frame envelope remains 32x48 with stable anchors

#### Scenario: Keeping gameplay behavior unchanged
- **WHEN** the player visual contract is evaluated after chibi/detail upgrades
- **THEN** movement constants, dash/jump timing windows, and collision semantics are unchanged
- **AND** only presentation behavior differs
