## 1. Pause Runtime Contract

- [x] 1.1 Add bridge-level pause and resume helpers for an active run, including clearing latched gameplay input when pause state changes
- [x] 1.2 Update gameplay scene ESC handling to pause the current run and open the menu as an overlay instead of starting a fresh menu flow
- [x] 1.3 Ensure `Continue` resumes the exact suspended runtime state and never calls the snapshot-recreating start or restart paths

## 2. Shared Menu Surface

- [x] 2.1 Refactor `MenuScene` into context-aware `main` and `pause` modes with `Start` or `Continue` as the primary action and shared `Options` and `Help` root entries
- [x] 2.2 Move difficulty, enemy pressure, and volume controls under a shared `Options` surface and keep only live-safe settings applying immediately during a paused run
- [x] 2.3 Replace the current rules panel with shared `Help` content that explains powers and enemy hazards/types, and implement ESC back-navigation across root and submenu layers

## 3. Regression Coverage And Validation

- [x] 3.1 Add automated regression coverage for pause-entry, exact in-place continue, and submenu ESC behavior without run-state loss
- [x] 3.2 Update the stage playtest flow to verify the new main-menu entries, pause-menu entries, shared help content, and exact gameplay resume behavior
- [x] 3.3 Run `npm test`, `npm run build`, and the change-scoped playtest validation for the new pause/menu flow