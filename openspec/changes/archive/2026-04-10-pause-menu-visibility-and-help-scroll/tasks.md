## 1. Pause Entry Stability

- [x] 1.1 Update gameplay pause-entry handling so the first `ESC` press opens a visible pause root and does not immediately trigger resume or close behavior
- [x] 1.2 Ensure the visible pause root stays active until the player chooses `Continue`, `Options`, `Help`, or presses `ESC` again from that root

## 2. Shared Help Overflow Behavior

- [x] 2.1 Refactor the shared `Help` surface to detect vertical overflow and enable scrolling only when the content exceeds the viewport height
- [x] 2.2 Add a visible scrollbar that tracks shared help scroll position and make it available from both main-menu and pause-menu entry points
- [x] 2.3 Support keyboard and pointer or wheel scrolling affordances on the shared help surface without splitting the content into separate menu-specific implementations

## 3. Regression Coverage And Validation

- [x] 3.1 Add regression coverage for pause-entry visibility and `ESC` back behavior across the pause root and pause submenus
- [x] 3.2 Add regression coverage for oversized shared help content, including scrollbar visibility and keyboard plus pointer or wheel scrolling from both menu contexts
- [x] 3.3 Run the build and relevant automated or playtest validation for the pause-menu visibility and shared-help scrolling flow