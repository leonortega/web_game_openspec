## Why

Pressing `ESC` during active gameplay pauses the run, but the pause menu can disappear immediately instead of remaining visible for the player to act on it. The shared `Help` view is also long enough that some powers and enemy details fall below the visible area, making important reference content unreadable without explicit scrolling support.

## What Changes

- Keep the pause menu visible when `ESC` pauses active gameplay so the player lands on the pause root instead of immediately dismissing it.
- Add explicit scrolling behavior to the shared `Help` surface, including a visible scrollbar whenever the content exceeds the viewport height.
- Apply the same scrollable `Help` behavior in both the main menu and pause menu because they reuse the same help surface.
- Clarify keyboard and pointer or wheel affordances for navigating oversized help content so implementation and test expectations are unambiguous.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `pause-menu`: The pause root must remain visible after `ESC` pauses gameplay, and the shared help view must stay usable while paused through explicit scrolling and scrollbar behavior.
- `main-menu`: The shared help view must support scrolling with a visible scrollbar and clear keyboard and pointer or wheel affordances when content exceeds the viewport.

## Impact

- Shared menu scene and overlay behavior in the Phaser menu UI, especially pause-entry handling and the reusable help surface.
- Input handling for keyboard navigation and pointer or wheel scrolling while a menu help panel is open.
- Playtest coverage that validates pause visibility and help readability from both the main menu and pause menu.
- The existing capability contracts in `openspec/specs/pause-menu/spec.md` and `openspec/specs/main-menu/spec.md`.