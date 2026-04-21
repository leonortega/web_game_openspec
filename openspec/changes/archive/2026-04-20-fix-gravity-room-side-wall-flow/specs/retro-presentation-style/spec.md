## MODIFIED Requirements

### Requirement: Gravity capsule presentation stays readable and distinct from stage exits
The game SHALL present enclosed gravity room sections as local retro-styled traversal infrastructure rather than as stage-completion endpoints. Each enclosed gravity room section MUST keep a readable outlined room shell except for one side-wall entry opening and one separate side-wall exit opening, and it MUST keep one linked interior disable button readable in both active and disabled states. The shell presentation for enclosed gravity rooms MUST NOT imply a bottom-door cutout, floor opening, or bottom-edge helper strip as part of the active doorway grammar. Room-local platforms, enemies, terrain, pickups, hazards, and other interior content inside these enclosed gravity rooms MUST keep their normal authored gameplay presentation rather than being force-recolored solely because they sit inside the room. Active rooms MUST visibly communicate that the gravity field is live, disabled rooms MUST visibly communicate that the field has been neutralized, and the traversal room MUST remain clearly distinct from the stage-exit capsule through shell framing, door treatment, button state, field-state cues, or equivalent local accents. Enclosed gravity rooms MUST NOT reuse the exit-finish teleport or dematerialization treatment. Across the current rollout, the four gravity rooms MUST read through the same lateral `IN`-left and `OUT`-right presentation grammar even when they use different local support geometry.

#### Scenario: Reading an active enclosed gravity room section
- **WHEN** the player approaches an enclosed gravity room section before its linked interior disable button has been triggered
- **THEN** the shell, side-wall door openings, button, field cues, and normally presented interior content read as an active traversal device rather than as a live exit or already neutralized route

#### Scenario: Reading a disabled enclosed gravity room section
- **WHEN** the player views an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the shell, door openings, button, or field cues visibly change so the room reads as neutralized during traversal
- **AND** interior room content keeps its same authored presentation identity instead of switching to a room-only recolor palette

#### Scenario: Comparing an enclosed gravity room section with the stage exit
- **WHEN** the player sees an enclosed gravity room section and the stage-completion capsule in the same play session
- **THEN** the traversal room reads as a separate mechanic and is not mistaken for the stage exit

#### Scenario: Comparing rolled-out gravity rooms across stages
- **WHEN** the player encounters enclosed gravity rooms in different current playable stages
- **THEN** each room uses the same shell-and-button presentation grammar while still preserving stage-specific layout, route shape, and normal interior content colors
- **AND** none of the rolled-out rooms relies on a bottom-door read to communicate entry or exit