# main-menu Specification

## Purpose
Define the main menu actions, settings access, help behavior, and presentation rules before gameplay begins.
## Requirements
### Requirement: The main menu exposes run settings and rules
The game SHALL present `Start`, `Options`, and `Help` from the main menu root. `Options` MUST expose master volume, enemy pressure, and difficulty selection before gameplay begins. `Help` MUST be readable from the main menu without requiring a stage start, and it MUST present concise explanations for powers and enemy hazards or types using the astronaut-themed player-facing power names while preserving the existing mechanics those names represent. The main-menu Help panel MUST use a larger visible panel size so more of that content is shown before scrolling is required. When the Help content still exceeds the available panel height, the surface MUST support vertical scrolling, MUST show a visible scrollbar, and MUST expose keyboard and pointer or wheel affordances for reaching the hidden content. Under this change, the menu root and help-facing presentation MUST use the shared retro visual language with harsher palette quantization, flat fills, strong contrast, and tighter sprite-like visual motion limits instead of the current modern green or amber treatment. When audio is available, the main menu MUST play the designated vendored CC0 menu track `Another space background track` by `yd` as its looping sustained title music. Once browser audio is unlocked and the menu owns sustained music, that track MUST become audibly active without requiring a scene reload, gameplay transition, or extra menu flow beyond the unlock interaction. The menu track MUST keep a distinct title-surface identity relative to the stage gameplay tracks, MUST keep playing until gameplay or another scene takes ownership of sustained music, MUST preserve existing menu actions without adding gameplay-state changes, scene-flow changes, or new persistent menu chrome, and MUST continue to honor the existing browser audio-unlock behavior.

#### Scenario: Adjusting settings from the main menu
- **WHEN** the player opens `Options` from the main menu and changes a setting
- **THEN** the game updates the selected run settings
- **AND** the interaction may play the menu confirm cue if audio is available

#### Scenario: Reviewing help from the main menu
- **WHEN** the player opens `Help` from the main menu
- **THEN** the game shows the help content without requiring a stage start
- **AND** that help content explains powers and enemy hazards or types using the astronaut-themed power names mapped to the existing mechanics
- **AND** the visible Help panel shows more of the content at once than the current smaller panel

#### Scenario: Scrolling oversized help from the main menu
- **WHEN** the player opens `Help` from the main menu and the help content exceeds the available panel height
- **THEN** the help panel shows a visible scrollbar
- **AND** the player can scroll through the hidden content with keyboard input and pointer or wheel input

#### Scenario: Viewing the retro-styled main menu
- **WHEN** the player views the main menu root or help-facing menu surface
- **THEN** the menu uses the shared limited-palette retro presentation with readable high-contrast title and option text
- **AND** it does not rely on smooth modern decorative motion or polished translucent panel styling

#### Scenario: Hearing the title theme after audio unlock
- **WHEN** the player unlocks audio on the main menu and remains on a menu surface
- **THEN** the menu starts the vendored track `Another space background track` as audibly active sustained title music without requiring a scene change
- **AND** that track remains active until gameplay or another scene takes ownership of sustained music

#### Scenario: Navigating the main menu with audio available
- **WHEN** the player moves between root actions or confirms or backs out of a menu surface after audio has been unlocked
- **THEN** the game plays synthesized navigation, confirm, or back cues that match the action
- **AND** the menu music remains active until gameplay or another scene takes ownership of sustained music

#### Scenario: Comparing menu music with stage music
- **WHEN** the player hears the unlocked main-menu music and then hears gameplay music from any stage
- **THEN** the menu music reads as its own space-themed title surface rather than reusing a stage gameplay track
