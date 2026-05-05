## Context

Gameplay currently treats `ESC` as an exit-to-menu shortcut: `GameScene` starts `MenuScene`, which abandons the active scene and therefore cannot preserve exact in-run state. The shared bridge surface exposes stage start, forced start, restart, input, HUD sync, and run-setting updates, but it does not expose pause or resume semantics for an existing run.

`MenuScene` is also built as a flat root list of `Start`, `Difficulty`, `Enemies`, `Volume`, and `Rules`. That structure does not match the requested root actions of `Start` or `Continue` plus `Options` and `Help`, and the current rules panel explains controls and powers but does not provide a dedicated concise explanation of enemy hazards and enemy types.

The current stage start flow recreates a fresh snapshot through `GameSession.startStage()` or `restartStage()`. Because those APIs rebuild the runtime state, `Continue` cannot call them and still satisfy exact in-place resume for player position, timers, collected items, checkpoint state, and stage progress.

## Goals / Non-Goals

**Goals:**
- Pause an already started run when `ESC` is pressed during gameplay.
- Resume the exact paused run in place without reconstructing the stage snapshot.
- Reuse one menu surface in both contexts, with `Start` as the main-menu primary action and `Continue` as the pause-menu primary action.
- Expose the same `Options` and `Help` entries in both contexts.
- Make help content shared across both contexts and explicitly cover powers plus enemy hazards/types.
- Preserve immediate application of settings where the existing runtime can support it safely.

**Non-Goals:**
- Rebuild the game UI outside Phaser.
- Introduce save/load or persist a paused run across reloads.
- Retroactively rebuild the currently paused stage when difficulty or enemy pressure changes.
- Redesign stage flow, HUD layout, or progression systems beyond the pause/menu interaction contract.

## Decisions

- Use one context-aware `MenuScene` for both main-menu and pause-menu entry.
  - The scene should accept a mode such as `main` or `pause` and render a shared root action list with context-specific primary action text.
  - In `main` mode, the root actions are `Start`, `Options`, and `Help`.
  - In `pause` mode, the root actions are `Continue`, `Options`, and `Help`.
  - Alternative considered: create a separate `PauseScene`. Rejected because it would duplicate option/help rendering, copy, and navigation logic that should stay consistent across both entry points.

- Add an explicit pause/resume contract to the bridge instead of relying only on raw scene orchestration.
  - The bridge should expose whether a resumable run is currently paused and provide pause/resume operations that the scenes can call.
  - Pausing should also clear latched gameplay input so movement, jump hold, dash, or shoot do not immediately replay on resume.
  - Alternative considered: store pause state only in Phaser scene data. Rejected because tests and menu logic need a stable gameplay-state contract that is not coupled to one scene instance.

- Preserve exact in-place resume by pausing gameplay updates rather than rebuilding session state.
  - `GameScene` should stop consuming frames while the pause menu is open, and `Continue` should resume the existing scene instead of calling `startStage()`, `forceStartStage()`, or `restartStage()`.
  - Alternative considered: serialize and recreate the session snapshot on continue. Rejected because it adds unnecessary state-copy complexity and increases the risk of timer or runtime drift.

- Restructure settings behind an `Options` panel instead of keeping them as top-level root actions.
  - `Options` should expose the existing difficulty, enemy pressure, and volume controls in both menu contexts.
  - `masterVolume` updates can apply immediately because audio already reads current run settings dynamically.
  - `difficulty` and `enemyPressure` updates should persist to run settings for future starts, restarts, or later stage transitions, but they must not rebuild the currently paused stage because that would violate exact resume.
  - Alternative considered: keep the current flat list and only relabel items. Rejected because the requested action model explicitly calls for `Options` and `Help` as the shared menu entries.

- Extract shared help copy so both menu contexts render the same content surface.
  - The help content should remain concise and cover controls, powers, powered-hit behavior, and enemy hazard/type explanations.
  - Alternative considered: keep separate rules/help text for main and pause contexts. Rejected because the request explicitly calls for the same `Help` entry and content surface in both places.

- Treat `ESC` as a layered back action while overlays are open.
  - From gameplay, `ESC` opens the pause root.
  - From pause `Options` or `Help`, `ESC` returns to the pause root without mutating run state.
  - From the pause root, `ESC` resumes the paused run.
  - From main-menu `Options` or `Help`, `ESC` returns to the main-menu root.
  - Alternative considered: make `ESC` always close the entire menu scene. Rejected because submenu dismissal and exact resume are distinct behaviors.

## Risks / Trade-offs

- [Input carry-over] Pausing mid-input could resume with stale held actions -> Clear bridge input latches on pause/resume and verify resume after movement/jump input.
- [Settings expectation mismatch] Players may expect difficulty or enemy pressure to change the already paused stage -> Keep the paused snapshot intact and verify only live-safe settings apply immediately during the current run.
- [Scene lifecycle regressions] Launching an overlay on top of a paused scene can leave duplicate listeners or HUD cleanup issues -> Keep pause entry and exit on a single controlled scene path and cover it in automated playtests.
- [Content drift] Separate help copy paths would diverge over time -> Store help sections in shared data or helper functions consumed by both menu contexts.

## Migration Plan

1. Add bridge-level pause/resume state and safe input reset helpers.
2. Update `GameScene` so `ESC` pauses gameplay and opens `MenuScene` in pause mode instead of replacing the run.
3. Refactor `MenuScene` into a context-aware root plus `Options` and `Help` overlays, with shared help content and pause-aware `Continue` behavior.
4. Extend tests and playtests to validate exact in-place resume, overlay back navigation, and shared menu behavior.
5. Run `npm test` and `npm run build`, then run the stage playtest flow for the new change.

## Open Questions

- No blocking technical questions remain for proposal. Apply can tune option/help copy length as long as the shared help surface stays concise and covers powers plus enemy hazards/types.