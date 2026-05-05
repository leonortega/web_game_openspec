## 1. Exit Capsule Door-Open Presentation

- [x] 1.1 Extend the shared capsule presentation in `src/phaser/view/capsulePresentation.ts` and any boot-time texture setup so the exit capsule can render a short exit-only door-open state without changing the grounded start-cabin final state.
- [x] 1.2 Update `src/phaser/scenes/GameScene.ts` to trigger the exit-cabin door-open beat from the existing bounded completion finish flow while preserving current objective gating, teleport readability, and stage-clear handoff timing.

## 2. Regression Coverage

- [x] 2.1 Update or add focused coverage for shared capsule presentation and completion sequencing so fresh-stage grounded cabin behavior remains unchanged and the exit door-open beat occurs only during valid completion.
- [x] 2.2 Run the relevant automated checks, including `npm test` and `npm run build`, and fix any regressions introduced by the exit-cabin presentation change.

## 3. Playtest Validation

- [x] 3.1 Run the grounded stage-start coverage, such as `node scripts/stage-start-capsule-entry-playtest.mjs`, and confirm the fixed grounded start cabin still behaves as authored.
- [x] 3.2 Run the exit-finish coverage, such as `node scripts/capsule-exit-teleport-finish-playtest.mjs`, and confirm the grounded exit cabin visibly opens during the finish sequence before the normal stage-clear handoff.