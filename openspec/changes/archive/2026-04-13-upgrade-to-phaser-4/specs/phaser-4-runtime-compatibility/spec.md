## ADDED Requirements

### Requirement: Phaser 4 runtime preserves current boot and scene flow
The game SHALL run the current browser play experience on Phaser 4 while preserving the single mounted game shell, the authored 960x540 FIT layout, the registry-backed bridge wiring, and the existing scene progression from boot to menu, stage intro, gameplay, and completion. If Phaser 4 migration requires a narrower renderer target than the current Phaser 3 AUTO configuration, the supported desktop browser runtime MAY require WebGL, but it MUST preserve the same player-visible scene ordering, restart flow, pause flow, and completion routing.

#### Scenario: Launching the migrated game
- **WHEN** the player opens the game in the supported browser runtime after the Phaser 4 migration
- **THEN** the game boots into the menu inside the existing mounted shell with the same scaled layout and bridge-backed session wiring

#### Scenario: Advancing through the current scene sequence
- **WHEN** the player starts a run, completes a stage, replays a stage, or returns to the menu after migration
- **THEN** the same scene keys and visible flow transitions occur as they did before the engine upgrade

### Requirement: Phaser 4 migration preserves current generated presentation assets and audio cues
The migration SHALL preserve the current placeholder boot textures, scrollable menu help panel, synthesized stage music, and gameplay cue coverage under Phaser 4 without depending on Phaser 3-only GeometryMask behavior, Phaser 3 Graphics texture-generation behavior, or direct sound-manager context internals. Any replacement implementation MUST keep the same authored UI affordances, help readability, stage music cadence, and cue coverage for player actions and hazards.

#### Scenario: Viewing the menu help panel
- **WHEN** the player opens the help view and scrolls through its content after the migration
- **THEN** the help text remains clipped to the intended viewport, the scrollbar reflects the same overflow behavior, and unrelated menu elements do not render inside the help window

#### Scenario: Unlocking stage audio and gameplay cues
- **WHEN** the player enters gameplay and performs actions that currently trigger synthesized music or cues
- **THEN** the migrated game resumes audio when input unlocks it and plays the same class of stage music and cue feedback as before the upgrade

### Requirement: Migration preserves simulation and playtest compatibility without Phaser 3-only helper coupling
The migration SHALL preserve current gameplay results and automated stage playtest flow while removing reliance on Phaser 3-only helper access from simulation code. `GameSession` and related simulation logic MUST continue to produce the same clamp-sensitive movement, enemy placement, pause, restart, and completion outcomes, and the existing stage playtest path MUST continue to boot the game, connect to the debug bridge, and consume run state after the engine upgrade.

#### Scenario: Running simulation paths that previously used Phaser math helpers
- **WHEN** gameplay updates exercise migrated `GameSession` paths that previously depended on `Phaser.Math` helpers
- **THEN** the resulting movement, bounds clamping, and state transitions match the pre-migration gameplay contract

#### Scenario: Running the automated stage playtest flow
- **WHEN** the stage playtest workflow launches the migrated game in the supported browser environment
- **THEN** it can still connect through the debug bridge, drive the existing flow, and report results against the current gameplay contracts