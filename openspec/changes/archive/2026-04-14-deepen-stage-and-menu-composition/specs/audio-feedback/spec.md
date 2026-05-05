## MODIFIED Requirements

### Requirement: Stages have distinct music identity
The game SHALL provide clearly retro 8-bit styled synthesized music that differentiates the menu and each authored playable stage through composition, not only through oscillator choice or playback speed. The implementation MUST preserve the existing procedural synthesized-audio direction, and the theme authoring data for the menu and each playable stage MUST define a recognizable motif family, phrase template, cadence or turnaround behavior, register range, intro phrase, gameplay loop, and completion phrase relationship. For stage music, the intro MUST state the stage hook, the gameplay music MUST develop that hook in a repeatable multi-phrase loop, and the clear or final phrase MUST resolve or close the same musical identity.

#### Scenario: Starting the menu and a stage
- **WHEN** the player unlocks audio on the main menu and later enters a stage intro and gameplay for a stage
- **THEN** the game plays a recognizable title theme on the menu surface
- **AND** the stage presentation plays a short synthesized intro phrase that states the stage hook for that specific stage
- **AND** the stage gameplay loop begins once gameplay starts and continues the same motif family rather than switching to an unrelated phrase

#### Scenario: Comparing the current playable stage themes
- **WHEN** a reviewer compares the gameplay music for `forest-ruins`, `amber-cavern`, and `sky-sanctum`
- **THEN** `forest-ruins` reads as rising or buoyant, `amber-cavern` reads as compressed or heavier, and `sky-sanctum` reads as higher or more open and floating
- **AND** the three stages do not reuse the same unchanged lead contour and cadence pattern

#### Scenario: Repeating a gameplay loop without fatigue
- **WHEN** any stage gameplay theme restarts after a full phrase cycle
- **THEN** the loop includes at least one authored repeat-relief behavior such as a turnaround bar, fill, bass variation, delayed counterline entrance, or pickup into the restart
- **AND** the restart does not feel like a raw abrupt reset of the same short note cell

### Requirement: Audio validation proves recognizable 8-bit differentiation
The game SHALL validate not only that music and sound cues trigger, but also that major audio surfaces are recognizably differentiated within the same synthesized 8-bit style. Validation for this composition pass MUST cover the unlocked menu theme and every currently playable stage theme, and it MUST verify theme structure, loop-variation behavior, and motif-family relationships across intro, gameplay, clear, and final phrases where applicable.

#### Scenario: Validating theme authoring structure
- **WHEN** automated audio validation inspects the authored menu and stage theme definitions for a build
- **THEN** each theme definition includes composition fields for motif identity, phrase template, cadence or turnaround behavior, register intent, and the relevant intro, gameplay, and completion phrase relationships
- **AND** validation fails if a stage falls back to a bare short loop without those authored structure cues

#### Scenario: Comparing menu and stage composition during validation
- **WHEN** automated coverage and playtest validation review the unlocked menu theme plus the gameplay music for `forest-ruins`, `amber-cavern`, and `sky-sanctum`
- **THEN** the validation proves the menu reads as a distinct title theme and each stage presents its own recognizable motif family within the shared 8-bit style
- **AND** the validation records that loop restarts, transition phrases, and completion phrases remain audibly differentiated rather than collapsing into interchangeable placeholder beeps