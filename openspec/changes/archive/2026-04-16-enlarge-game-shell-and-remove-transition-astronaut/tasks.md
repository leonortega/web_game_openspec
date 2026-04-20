## 1. Shell sizing

- [x] 1.1 Update the game shell sizing in `src/phaser/createGameApp.ts` and `src/styles/app.css` so the centered play surface grows substantially on roomy desktop viewports while preserving the current internal 960x540 Phaser resolution and fit behavior.
- [x] 1.2 Verify the updated shell remains bounded and centered on constrained viewports without clipped primary content or horizontal overflow.

## 2. Transition scene presentation

- [x] 2.1 Remove the decorative astronaut or player-figure accent from `src/phaser/scenes/StageIntroScene.ts` while preserving current stage status readability, timing semantics, and existing transition flow.
- [x] 2.2 Remove the decorative astronaut or player-figure accent from `src/phaser/scenes/CompleteScene.ts` while preserving current completion messaging, timing semantics, and audio handoff behavior.

## 3. Validation

- [x] 3.1 Update or confirm any affected automated coverage for shell sizing or transition-scene presentation regressions.
- [x] 3.2 Run `npm test` and `npm run build` and fix any regressions caused by this change.
- [x] 3.3 Run the available stage-flow playtest coverage and confirm the enlarged shell and astronaut-free transition scenes behave correctly without altering gameplay flow.