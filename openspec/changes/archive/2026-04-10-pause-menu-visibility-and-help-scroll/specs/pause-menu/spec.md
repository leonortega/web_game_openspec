## MODIFIED Requirements

### Requirement: ESC opens a gameplay pause menu
The game SHALL pause an already started gameplay run when the player presses `ESC` during active play. While paused, the game SHALL show a pause menu whose root actions are `Continue`, `Options`, and `Help`. The same `ESC` press that enters pause MUST leave the pause root visible and MUST NOT immediately resume gameplay or dismiss the pause menu.

#### Scenario: Opening the pause menu during active play
- **WHEN** the player presses `ESC` during an active started run
- **THEN** gameplay simulation stops advancing
- **AND** the pause menu becomes visible
- **AND** the pause menu shows `Continue`, `Options`, and `Help`
- **AND** the same key press does not immediately close the pause root or resume the run

### Requirement: Pause options and help reuse the shared menu surfaces
The pause menu SHALL expose the same `Options` and `Help` surfaces used by the main menu. `Options` MUST expose difficulty, enemy pressure, and master volume controls. `Help` MUST present concise explanations for powers and enemy hazards/types. When the shared help content exceeds the viewport height, the `Help` surface MUST support vertical scrolling, MUST show a visible scrollbar, and MUST expose keyboard and pointer or wheel affordances for reading the hidden content.

#### Scenario: Adjusting settings while paused
- **WHEN** the player opens `Options` from the pause menu and changes a setting
- **THEN** the game records that setting change without discarding the paused run

#### Scenario: Reviewing help while paused
- **WHEN** the player opens `Help` from the pause menu
- **THEN** the game shows the shared help content
- **AND** that help content explains powers and enemy hazards/types

#### Scenario: Scrolling oversized help while paused
- **WHEN** the player opens `Help` from the pause menu and the shared help content exceeds the viewport height
- **THEN** the help panel shows a visible scrollbar
- **AND** the player can scroll through the hidden content with keyboard input and pointer or wheel input

### Requirement: ESC backs out of pause overlays without losing run state
While a gameplay pause is active, `ESC` SHALL behave as a back action after the pause root is visible. Pressing `ESC` from pause `Options` or `Help` MUST return to the pause root, and pressing `ESC` from the visible pause root MUST resume the suspended run without losing run state.

#### Scenario: Closing a pause submenu
- **WHEN** the player presses `ESC` while pause `Options` or `Help` is open
- **THEN** the submenu closes and the pause root menu remains available
- **AND** the suspended run state remains unchanged

#### Scenario: Resuming by pressing ESC from the pause root
- **WHEN** the player presses `ESC` while the pause root menu is open
- **THEN** the game resumes the exact suspended run in place
