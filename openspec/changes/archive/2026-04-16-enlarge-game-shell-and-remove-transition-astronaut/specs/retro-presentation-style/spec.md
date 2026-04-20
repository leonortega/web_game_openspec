## ADDED Requirements

### Requirement: Game shell scales up presentation on roomy displays without changing gameplay resolution
The game SHALL present its browser shell as a centered responsive container that grows substantially larger on roomy desktop viewports than the current baseline while preserving the existing internal gameplay resolution and Phaser scaling behavior. The enlarged shell MUST remain bounded by viewport-aware sizing so the game continues to fit on smaller laptops and mobile screens without horizontal overflow, clipped UI, or off-center framing. This shell-sizing change MUST remain presentation-only and MUST NOT alter gameplay timing, authored stage dimensions, camera semantics, or HUD meaning.

#### Scenario: Viewing the game on a large desktop display
- **WHEN** the player opens the game on a desktop viewport with enough width and height to support a larger shell
- **THEN** the centered game presentation renders substantially larger than the current baseline instead of staying near the prior 1080 px shell cap
- **AND** the underlying gameplay resolution and scene behavior remain unchanged

#### Scenario: Viewing the game on a constrained display
- **WHEN** the player opens the game on a smaller laptop, tablet, or mobile-sized viewport
- **THEN** the shell still fits within the available viewport without horizontal scrolling or clipped primary game content
- **AND** the presentation remains centered and readable

#### Scenario: Comparing shell sizing to gameplay behavior
- **WHEN** the enlarged shell presentation is evaluated during menu, transition, or active gameplay flow
- **THEN** the change reads as a browser-shell sizing adjustment rather than a gameplay zoom or resolution change
- **AND** player timing, stage layout, and camera behavior remain the same as before