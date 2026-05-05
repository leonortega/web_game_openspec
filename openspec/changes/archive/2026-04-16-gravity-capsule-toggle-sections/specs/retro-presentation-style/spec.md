## ADDED Requirements

### Requirement: Gravity capsule presentation stays readable and distinct from stage exits
The game SHALL present gravity capsule sections as local retro-styled traversal infrastructure rather than as stage-completion endpoints. Each gravity capsule section MUST keep a readable shell, door, and linked button presentation in both dormant and enabled states, and those states MUST remain visually distinguishable during active play without relying on HUD text or a separate prompt. Gravity capsule sections MUST remain clearly distinct from the stage-exit capsule through silhouette, orientation, local accents, or state cues, and they MUST NOT reuse the exit-finish teleport or dematerialization treatment.

#### Scenario: Reading a dormant gravity capsule section
- **WHEN** the player approaches a gravity capsule section before its linked button has been triggered
- **THEN** the shell and button read as a dormant traversal device rather than as a live exit or already enabled route

#### Scenario: Reading an enabled gravity capsule section
- **WHEN** the player views a gravity capsule section after its linked button has enabled it
- **THEN** the shell, door, or field cues visibly change so the enabled route reads as active during traversal

#### Scenario: Comparing a gravity capsule section with the stage exit
- **WHEN** the player sees a traversal gravity capsule section and the stage-completion capsule in the same play session
- **THEN** the traversal capsule reads as a separate mechanic and is not mistaken for the stage exit