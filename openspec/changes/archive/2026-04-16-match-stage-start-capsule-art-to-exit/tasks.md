## 1. Shared Capsule Art Reuse

- [x] 1.1 Update the stage-start cabin rendering in `src/phaser/scenes/GameScene.ts` and any supporting helpers so fresh stage starts use the same authored exit-capsule art path defined from `src/phaser/scenes/BootScene.ts` instead of separate rectangle shell and door pieces.
- [x] 1.2 Keep the current grounded fixed-cabin anchor, rematerialization beat, scripted walk-out, door-close beat, and inert closed prop handoff unchanged while applying the shared art reuse.

## 2. Focused Regression Coverage

- [x] 2.1 Extend focused automated coverage in `src/phaser/view/capsulePresentation.test.ts` or related tests so exact start-to-exit art reuse is asserted without weakening existing sequence-phase expectations.
- [x] 2.2 Update or add scripted playtest coverage in `scripts/stage-start-capsule-entry-playtest.mjs` and `scripts/capsule-exit-teleport-finish-playtest.mjs` to prove exact art parity did not regress fresh-start, auto-advance, exit-finish, or checkpoint-bypass behavior.

## 3. Validation

- [x] 3.1 Run `npm test`, `npm run build`, `node scripts/stage-start-capsule-entry-playtest.mjs`, and `node scripts/capsule-exit-teleport-finish-playtest.mjs`, then fix any regressions introduced by the shared-art implementation.