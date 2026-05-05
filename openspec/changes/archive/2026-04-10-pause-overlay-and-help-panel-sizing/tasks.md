## 1. Gameplay Pause Overlay

- [x] 1.1 Replace the current gameplay pause-menu presentation with an obscured overlay that shows only centered `PAUSE` text while the run is suspended.
- [x] 1.2 Update gameplay input handling so pressing `ESC` during an active run pauses in place and pressing `ESC` again resumes the exact suspended run without restarting stage flow.
- [x] 1.3 Remove pause-time access paths for `Continue`, `Options`, and `Help`, including any pause-specific submenu bindings or visible actions.

## 2. Main-Menu Help Panel Sizing

- [x] 2.1 Increase the main-menu Help panel size so it displays more help text before scrolling is needed.
- [x] 2.2 Preserve overflow scrolling, visible scrollbar behavior, and existing help readability on smaller viewports when the larger panel still cannot fit all content.

## 3. Regression Coverage And Validation

- [x] 3.1 Add or update coverage for ESC-driven pause/resume toggling and exact in-place resume behavior.
- [x] 3.2 Add or update coverage that confirms paused gameplay no longer exposes `Continue`, `Options`, or `Help`, and that main-menu Help remains scrollable when oversized.
- [x] 3.3 Run the relevant automated checks and change-scoped playtest validation for the new pause overlay and larger main-menu Help panel behavior.