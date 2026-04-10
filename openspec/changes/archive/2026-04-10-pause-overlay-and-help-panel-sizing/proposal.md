## Why

The current pause flow opens a navigable pause menu with extra actions that are no longer desired, and it makes the paused state more complex than the requested simple suspend-and-resume interaction. The main-menu Help panel also shows too little content at once, forcing unnecessary scrolling through reference text.

## What Changes

- Replace the gameplay pause menu with a passive pause overlay that obscures gameplay and shows only centered `PAUSE` text.
- Make `ESC` toggle that overlay during active gameplay so the first press pauses the exact current run and the next press resumes the same suspended run in place.
- Remove pause-time access to `Continue`, `Options`, and `Help` so paused gameplay no longer exposes submenu navigation.
- Increase the main-menu Help panel size so more help content is visible before scrolling is required, while preserving overflow scrolling and a visible scrollbar when content still exceeds the panel.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `pause-menu`: Gameplay pause changes from a navigable menu to an obscured overlay with centered `PAUSE` text, and `ESC` becomes the sole pause/resume control.
- `main-menu`: The Help panel becomes larger to reduce scrolling while retaining overflow scrolling behavior when needed.

## Impact

- Affected gameplay pause presentation, pause-state input handling, and exact in-place resume behavior.
- Affected main-menu Help layout and overflow behavior.
- Affected regression coverage for pause toggling, removal of pause submenu actions, and enlarged Help readability.
- Updated capability contracts in `openspec/specs/pause-menu/spec.md` and `openspec/specs/main-menu/spec.md`.