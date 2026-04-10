# pause-menu Specification

## Purpose
TBD - created by archiving change pause-menu-esc-continue-options-help. Update Purpose after archive.
## Requirements
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