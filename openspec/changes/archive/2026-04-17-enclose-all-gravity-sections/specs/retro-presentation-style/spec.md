## MODIFIED Requirements

### Requirement: Gravity capsule presentation stays readable and distinct from stage exits
The game SHALL present enclosed gravity room sections as local retro-styled traversal infrastructure rather than as stage-completion endpoints. Each enclosed gravity room section MUST keep a fully enclosed blue outlined room shell except for one bottom entry opening and one separate bottom exit opening, and it MUST keep one linked interior yellow disable button in both active and disabled states. Room-local platforms and other room support geometry inside these enclosed gravity rooms MUST read black, and room-local enemies inside these sections MUST read red so the room contents stay visually grouped and readable during traversal. Active rooms MUST visibly communicate that the gravity field is live, disabled rooms MUST visibly communicate that the field has been neutralized, and the traversal room MUST remain clearly distinct from the stage-exit capsule through silhouette, room framing, local accents, or state cues. Enclosed gravity rooms MUST NOT reuse the exit-finish teleport or dematerialization treatment.

#### Scenario: Reading an active enclosed gravity room section
- **WHEN** the player approaches an enclosed gravity room section before its linked interior disable button has been triggered
- **THEN** the blue outlined shell, bottom door openings, yellow button, black platforms, and red enemies read as an active traversal device rather than as a live exit or already neutralized route

#### Scenario: Reading a disabled enclosed gravity room section
- **WHEN** the player views an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the shell, door openings, button, or field cues visibly change so the room reads as neutralized during traversal while preserving the same room-local visual language

#### Scenario: Comparing an enclosed gravity room section with the stage exit
- **WHEN** the player sees an enclosed gravity room section and the stage-completion capsule in the same play session
- **THEN** the traversal room reads as a separate mechanic and is not mistaken for the stage exit

#### Scenario: Comparing rolled-out gravity rooms across stages
- **WHEN** the player encounters enclosed gravity rooms in different current playable stages
- **THEN** each room uses the same blue-shell, black-platform, red-enemy, yellow-button visual family while still preserving stage-specific layout and route shape