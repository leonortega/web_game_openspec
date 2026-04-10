## ADDED Requirements

### Requirement: ESC toggles a gameplay pause overlay
The game SHALL pause an already started gameplay run when the player presses `ESC` during active play. While paused, the game SHALL obscure the gameplay view and show only centered `PAUSE` text as the visible pause affordance. Pressing `ESC` again while that overlay is visible MUST resume the exact suspended run in place, preserving current player position, active timers, checkpoint progress, collected-item state, and current stage progress, and it MUST NOT recreate the normal stage-start flow.

#### Scenario: Pausing active gameplay with the overlay
- **WHEN** the player presses `ESC` during an active started run
- **THEN** gameplay simulation stops advancing
- **AND** the game obscures the gameplay view
- **AND** the only pause text shown to the player is centered `PAUSE`

#### Scenario: Resuming the suspended run with ESC
- **WHEN** the player presses `ESC` while the gameplay pause overlay is visible
- **THEN** the game resumes the exact suspended run in place
- **AND** the player returns to the same runtime state that was active when pause began
- **AND** the game does not restart the stage or replay the stage-intro flow

## REMOVED Requirements

### Requirement: ESC opens a gameplay pause menu
**Reason**: Gameplay pause no longer opens a navigable pause menu and instead uses a passive overlay.
**Migration**: Replace pause-entry expectations with the ESC-driven pause overlay behavior.

### Requirement: Continue resumes the exact suspended run
**Reason**: Resuming is now performed by pressing `ESC` again from the pause overlay instead of activating a `Continue` menu action.
**Migration**: Validate exact in-place resume through the pause overlay toggle scenarios.

### Requirement: Pause options and help reuse the shared menu surfaces
**Reason**: `Options` and `Help` are no longer accessible while gameplay is paused.
**Migration**: Keep `Options` and `Help` reachable from the main menu only.

### Requirement: ESC backs out of pause overlays without losing run state
**Reason**: Pause no longer has nested overlays or submenu back-navigation; `ESC` now toggles a single pause overlay on and off.
**Migration**: Replace submenu back-navigation coverage with ESC pause/resume toggle coverage.