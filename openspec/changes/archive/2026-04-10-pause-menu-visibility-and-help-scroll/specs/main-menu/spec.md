## MODIFIED Requirements

### Requirement: The main menu exposes run settings and rules
The game SHALL present `Start`, `Options`, and `Help` from the main menu root. `Options` MUST expose master volume, enemy pressure, and difficulty selection before gameplay begins. `Help` MUST be readable from the main menu without requiring the player to begin a stage, and it MUST present the same concise help content used by the pause menu, including powers and enemy hazards/types. When the shared help content exceeds the viewport height, the `Help` surface MUST support vertical scrolling, MUST show a visible scrollbar, and MUST expose keyboard and pointer or wheel affordances for reaching the hidden content.

#### Scenario: Adjusting settings from the main menu
- **WHEN** the player opens `Options` from the main menu and changes a setting
- **THEN** the game updates the selected run settings

#### Scenario: Reviewing help from the main menu
- **WHEN** the player opens `Help` from the main menu
- **THEN** the game shows the shared help content without requiring a stage start
- **AND** that help content explains powers and enemy hazards/types

#### Scenario: Scrolling oversized help from the main menu
- **WHEN** the player opens `Help` from the main menu and the shared help content exceeds the viewport height
- **THEN** the help panel shows a visible scrollbar
- **AND** the player can scroll through the hidden content with keyboard input and pointer or wheel input

#### Scenario: Starting after visiting a submenu
- **WHEN** the player returns from `Options` or `Help` to the main menu root and selects `Start`
- **THEN** the game begins the normal gameplay flow using the selected settings
