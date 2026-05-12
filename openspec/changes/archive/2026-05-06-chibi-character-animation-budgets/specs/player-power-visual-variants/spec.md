## MODIFIED Requirements

### Requirement: Player presentation uses bounded retro animation states
The game SHALL present the base astronaut variant and each supported power variant through a bounded set of readable retro animation states rather than a mostly static pose. Under the chibi presentation contract, the player MUST keep a compact side-view astronaut silhouette with readable helmet/head mass, segmented torso-limb poses, and power-specific accents that remain clear at gameplay scale. The player sheet MUST stay within the existing 32x48 frame envelope and MUST use the frame-budget ranges defined in `art.md` for locomotion, action, hit-react, and defeat clips. Supported player hit-react presentation MAY include one short object-local flash or Beam-assisted accent, but that accent MUST remain brief, MUST preserve readability of the active variant underneath it, and MUST NOT change mechanics, timing, or collision.

#### Scenario: Reading a detailed chibi powered player
- **WHEN** a supported power variant is active during movement and jumps
- **THEN** the player remains readable as a compact chibi astronaut with distinct power cues
- **AND** readability does not depend on tint-only swaps or subpixel-only detail

#### Scenario: Respecting player frame budgets
- **WHEN** player clips are authored or revised for richer motion
- **THEN** each state remains within the min/max frame ranges listed in `art.md`
- **AND** the player frame envelope remains 32x48 with stable anchors

#### Scenario: Keeping gameplay behavior unchanged
- **WHEN** the player visual contract is evaluated after chibi/detail upgrades
- **THEN** movement constants, dash/jump timing windows, and collision semantics are unchanged
- **AND** only presentation behavior differs
