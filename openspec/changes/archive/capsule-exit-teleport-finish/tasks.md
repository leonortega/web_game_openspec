## 1. Exit Finish State

- [x] 1.1 Extend `src/game/simulation/GameSession.ts` so a valid exit completion starts a bounded capsule-entry finish state that freezes further gameplay interaction, preserves existing objective and alive-state gating, and hands off cleanly to the normal completion flow after the short finish window.
- [x] 1.2 Update or add focused simulation coverage in `src/game/simulation/GameSession.test.ts` for valid exit completion, incomplete-objective rejection, single-trigger behavior, and post-finish handoff timing.

## 2. Capsule Presentation And Teleport Cue

- [x] 2.1 Update the exit presentation in `src/phaser/scenes/BootScene.ts` and `src/phaser/scenes/GameScene.ts` so the endpoint reads as a grounded capsule-style finish prop without changing the current exit footprint or collision semantics.
- [x] 2.2 Implement the bounded multipart player dematerialization effect in `src/phaser/scenes/GameScene.ts` so the player visibly resolves into the capsule and disappears before the completion scene handoff while keeping nearby route information readable.
- [x] 2.3 Add the dedicated capsule-entry teleport cue in `src/audio/audioContract.ts` and `src/phaser/audio/SynthAudio.ts`, then trigger it exactly once when the exit-finish sequence begins.

## 3. Regression Coverage And Validation

- [x] 3.1 Update any affected scene or audio tests so the exit finish presentation and teleport cue routing remain covered without changing unrelated transition-scene behavior.
- [x] 3.2 Run `npm test` and `npm run build`, then fix any regressions introduced by the capsule exit finish implementation.
- [x] 3.3 Run the available stage-flow or completion-focused playtest coverage and confirm the player disappears through the capsule-entry finish before the normal stage-clear scene appears.