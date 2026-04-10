## ADDED Requirements

### Requirement: The main menu defaults to a minimal title-and-options layout
The game SHALL render the main menu with only the game name and interactive option controls visible by default. Subtitle copy, footer/meta text, and any persistent run summary MUST be omitted from the default menu view.

#### Scenario: Opening the main menu
- **WHEN** the player reaches the main menu before starting a run
- **THEN** the screen shows the game title and option controls
- **AND** no subtitle, footer/meta panel, or run summary is visible by default

### Requirement: Menu options remain available after the layout is simplified
The game SHALL continue to expose the existing start, difficulty, enemy pressure, volume, and rules controls through the main menu option list. Simplifying the default layout MUST NOT remove or alter the behavior of those controls.

#### Scenario: Adjusting settings from the simplified menu
- **WHEN** the player uses the option list to change difficulty, enemy pressure, or volume
- **THEN** the selected run settings are updated as before

#### Scenario: Starting a run from the simplified menu
- **WHEN** the player activates `Start`
- **THEN** the game begins the normal gameplay flow using the selected settings

#### Scenario: Opening rules from the simplified menu
- **WHEN** the player activates the rules option
- **THEN** the rules view opens without requiring the subtitle or footer chrome to be present
