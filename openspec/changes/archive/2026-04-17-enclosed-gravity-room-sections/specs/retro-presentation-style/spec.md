## MODIFIED Requirements

### Requirement: Gravity capsule presentation stays readable and distinct from stage exits
The game SHALL present enclosed gravity room sections as local retro-styled traversal infrastructure rather than as stage-completion endpoints. Each enclosed gravity room section MUST keep a readable room shell, separate bottom entry and bottom exit openings, and one linked interior disable button in both active and disabled states, and those states MUST remain visually distinguishable during active play without relying on HUD text or a separate prompt. Active rooms MUST visibly communicate that the gravity field is live, disabled rooms MUST visibly communicate that the field has been neutralized, and the traversal room MUST remain clearly distinct from the stage-exit capsule through silhouette, room framing, local accents, or state cues. Enclosed gravity rooms MUST NOT reuse the exit-finish teleport or dematerialization treatment.

#### Scenario: Reading an active enclosed gravity room section
- **WHEN** the player approaches an enclosed gravity room section before its linked interior disable button has been triggered
- **THEN** the shell, door openings, and button read as an active traversal device rather than as a live exit or already neutralized route

#### Scenario: Reading a disabled enclosed gravity room section
- **WHEN** the player views an enclosed gravity room section after its linked interior button has disabled the room field
- **THEN** the shell, door openings, button, or field cues visibly change so the room reads as neutralized during traversal

#### Scenario: Comparing an enclosed gravity room section with the stage exit
- **WHEN** the player sees an enclosed gravity room section and the stage-completion capsule in the same play session
- **THEN** the traversal room reads as a separate mechanic and is not mistaken for the stage exit