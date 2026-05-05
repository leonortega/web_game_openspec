## 1. Stage Authoring Model

- [x] 1.1 Extend stage content definitions and validation for scanner switches, linked temporary bridges, stable authored IDs, and any required timer fields.
- [x] 1.2 Add or update authored stage fixtures in `src/game/content/stages.ts` so at least one optional route uses a scanner switch to open a temporary bridge.

## 2. Runtime Traversal State

- [x] 2.1 Update `src/game/simulation/state.ts` to represent temporary bridge runtime state, including activation, remaining time, support-safe expiry, and reset behavior.
- [x] 2.2 Update `src/game/simulation/GameSession.ts` to trigger scanner switches on player entry, start and refresh bridge timers, defer expiry while top-surface support remains, and reset bridge state on death, checkpoint respawn, restart, and fresh attempts.
- [x] 2.3 Update `src/phaser/scenes/GameScene.ts` so temporary bridges stay hidden and non-solid until active, remain synchronized with simulation timing, and disappear after expiry once support contact ends.

## 3. Validation Coverage

- [x] 3.1 Add or extend `src/game/simulation/state.test.ts` coverage for temporary bridge reset rules across death, checkpoint respawn, and fresh attempts.
- [x] 3.2 Add or extend `src/game/simulation/GameSession.test.ts` coverage for scanner-trigger activation timing, refresh on re-entry, and occupied expiry behavior.
- [x] 3.3 Update `scripts/stage-playtest.mjs` to validate scanner-switch optional routes and temporary bridge traversal timing during stage playtests.
