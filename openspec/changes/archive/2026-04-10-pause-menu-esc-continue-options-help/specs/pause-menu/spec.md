## ADDED Requirements

### Requirement: ESC opens a gameplay pause menu
The game SHALL pause an already started gameplay run when the player presses `ESC` during active play. While paused, the game SHALL show a pause menu whose root actions are `Continue`, `Options`, and `Help`.

#### Scenario: Opening the pause menu during active play
- **WHEN** the player presses `ESC` during an active started run
- **THEN** gameplay simulation stops advancing
- **AND** the pause menu becomes visible
- **AND** the pause menu shows `Continue`, `Options`, and `Help`

### Requirement: Continue resumes the exact suspended run
The pause menu `Continue` action SHALL resume the exact run that was paused. Resuming MUST preserve current player position, active timers, checkpoint progress, collected-item state, and current stage progress, and it MUST NOT recreate the normal stage-start flow.

#### Scenario: Continuing from a paused run
- **WHEN** the player activates `Continue` from the pause menu root
- **THEN** the paused gameplay scene resumes in place
- **AND** the player returns to the same runtime state that was active when pause began
- **AND** the game does not restart the stage or replay the stage-intro flow

### Requirement: Pause options and help reuse the shared menu surfaces
The pause menu SHALL expose the same `Options` and `Help` surfaces used by the main menu. `Options` MUST expose difficulty, enemy pressure, and master volume controls. `Help` MUST present concise explanations for powers and enemy hazards/types.

#### Scenario: Adjusting settings while paused
- **WHEN** the player opens `Options` from the pause menu and changes a setting
- **THEN** the game records that setting change without discarding the paused run

#### Scenario: Reviewing help while paused
- **WHEN** the player opens `Help` from the pause menu
- **THEN** the game shows the shared help content
- **AND** that help content explains powers and enemy hazards/types

### Requirement: ESC backs out of pause overlays without losing run state
While a gameplay pause is active, `ESC` SHALL behave as a back action. Pressing `ESC` from pause `Options` or `Help` MUST return to the pause root, and pressing `ESC` from the pause root MUST resume the suspended run without losing run state.

#### Scenario: Closing a pause submenu
- **WHEN** the player presses `ESC` while pause `Options` or `Help` is open
- **THEN** the submenu closes and the pause root menu remains available
- **AND** the suspended run state remains unchanged

#### Scenario: Resuming by pressing ESC from the pause root
- **WHEN** the player presses `ESC` while the pause root menu is open
- **THEN** the game resumes the exact suspended run in place
