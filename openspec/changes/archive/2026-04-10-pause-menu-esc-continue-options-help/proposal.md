## Why

The current ESC behavior abandons the active run and returns to the menu flow, which breaks player expectations for a pause action and discards in-stage progress. The menu surface also splits settings and explanation content across older labels and does not provide a single Help view that explains both powers and enemies.

## What Changes

- Add an in-game pause menu that opens when the player presses `ESC` during an active run.
- Require `Continue` to resume the exact suspended run in place, preserving player position, timers, stage progress, and other active runtime state instead of recreating the stage start flow.
- Rework the menu option set so gameplay pause uses `Continue`, `Options`, and `Help`, while the main menu uses `Start`, `Options`, and `Help`.
- Replace the current rules-oriented explanation surface with shared Help content that concisely explains powers and enemy hazards/types in both menu contexts.
- Define ESC/back behavior for pause, options, and help overlays so players can move between those layers without losing run state.

## Capabilities

### New Capabilities
- `pause-menu`: Opening a gameplay pause overlay, suspending active play safely, navigating pause/options/help layers, and resuming the exact current run.

### Modified Capabilities
- `main-menu`: The main menu option set changes to `Start`, `Options`, and `Help`, and the shared Help content replaces the prior rules-only surface while keeping settings available before a run starts.

## Impact

- Affected gameplay/menu scene flow, especially `GameScene`, `MenuScene`, and the Phaser bridge/surface that currently has no pause-resume contract.
- Affected menu/help copy, input handling, and setting application behavior for both gameplay pause and main menu contexts.
- Affected automated playtest coverage for ESC handling, exact in-place resume, and shared options/help navigation.
- New `pause-menu` capability spec plus a delta to the existing `main-menu` capability spec.