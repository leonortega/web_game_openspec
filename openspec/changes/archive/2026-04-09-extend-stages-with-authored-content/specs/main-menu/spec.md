## MODIFIED Requirements

### Requirement: The game provides a main menu entry point
The game SHALL present a main menu before active gameplay begins. The menu MUST allow the player to start the game from the current profile or run state.

#### Scenario: Starting from the main menu
- **WHEN** the player selects `Start`
- **THEN** the game begins the normal gameplay flow using the selected settings

### Requirement: The main menu exposes run settings and rules
The game SHALL expose controls for master volume, enemy pressure, rules explanation, and difficulty selection from the main menu. The rules explanation MUST be readable from the menu without requiring the player to begin a stage.

#### Scenario: Adjusting volume from the menu
- **WHEN** the player changes the volume control
- **THEN** the game updates the master audio level for the run

#### Scenario: Reviewing the rules
- **WHEN** the player opens the rules view from the main menu
- **THEN** the game shows the rules explanation in a readable panel or scene

#### Scenario: Selecting difficulty before starting
- **WHEN** the player changes the difficulty setting
- **THEN** the next gameplay start uses that difficulty selection

#### Scenario: Adjusting enemy pressure
- **WHEN** the player changes the enemy setting from the menu
- **THEN** the game records the selected enemy pressure for gameplay

### Requirement: The main menu shows selection status in a compact footer
The game SHALL show the currently selected option and active run settings as a tiny status line at the bottom-right of the menu. The menu MUST NOT present that selection summary in a top-of-screen UI block.

#### Scenario: Moving between menu options
- **WHEN** the player changes the highlighted option
- **THEN** the bottom-right footer updates with the current selection and run-setting status

#### Scenario: Viewing the menu without interacting
- **WHEN** the player opens the main menu
- **THEN** the top area remains focused on the title and menu actions while the footer carries the small status text
