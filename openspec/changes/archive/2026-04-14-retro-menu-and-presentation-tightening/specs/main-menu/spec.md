## MODIFIED Requirements

### Requirement: The main menu exposes run settings and rules
The game SHALL present `Start`, `Options`, and `Help` from the main menu root. `Options` MUST expose master volume, enemy pressure, and difficulty selection before gameplay begins. `Help` MUST be readable from the main menu without requiring the player to begin a stage, and it MUST present concise explanations for powers and enemy hazards or types using the astronaut-themed player-facing power names while preserving the existing mechanics those names represent. The main-menu Help panel MUST use a larger visible panel size so more of that content is shown before scrolling is required. When the Help content still exceeds the available panel height, the surface MUST support vertical scrolling, MUST show a visible scrollbar, and MUST expose keyboard and pointer or wheel affordances for reaching the hidden content. Under this change, the menu root and help-facing presentation MUST use the shared retro visual language with harsher palette quantization, flat fills, strong contrast, and tighter sprite-like visual motion limits instead of the current modern green/amber treatment. This restyling MUST preserve existing menu actions and MUST NOT add gameplay-state changes, scene-flow changes, or new persistent menu chrome.

#### Scenario: Adjusting settings from the main menu
- **WHEN** the player opens `Options` from the main menu and changes a setting
- **THEN** the game updates the selected run settings

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