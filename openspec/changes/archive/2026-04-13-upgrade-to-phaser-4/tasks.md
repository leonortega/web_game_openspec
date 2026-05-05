## 1. Dependency And Boot Migration

- [x] 1.1 Upgrade `package.json` and any required Phaser typings or import usage to a Phaser 4-compatible dependency set.
- [x] 1.2 Update `src/phaser/createGameApp.ts` to a Phaser 4-compatible game configuration while preserving the existing mount node, canvas sizing, FIT scaling, physics setup, bridge registry wiring, and scene order.
- [x] 1.3 Confirm the migrated runtime still boots through the existing debug path used by `scripts/stage-playtest.mjs`, including any renderer compatibility adjustment needed for the supported browser environment.

## 2. Scene And Rendering Compatibility

- [x] 2.1 Migrate `src/phaser/scenes/BootScene.ts` to a Phaser 4-compatible runtime texture generation path that preserves the current placeholder visuals.
- [x] 2.2 Replace `src/phaser/scenes/MenuScene.ts` help viewport `GeometryMask` usage with a Phaser 4-compatible clipping solution that preserves scrolling, scrollbar visibility, and scene cleanup.
- [x] 2.3 Update `src/phaser/scenes/BootScene.ts`, `src/phaser/scenes/MenuScene.ts`, `src/phaser/scenes/StageIntroScene.ts`, `src/phaser/scenes/GameScene.ts`, and `src/phaser/scenes/CompleteScene.ts` so scene startup, delayed transitions, restart flow, pause behavior, resize handling, and shutdown cleanup match current behavior under Phaser 4.
- [x] 2.4 Update `src/phaser/view/camera/configureCamera.ts` and any related camera usage to Phaser 4-compatible semantics without changing player-visible framing or follow behavior.

## 3. Audio And Simulation Decoupling

- [x] 3.1 Refactor `src/phaser/audio/SynthAudio.ts` to use a Phaser 4-compatible audio backend instead of direct `scene.sound.context` access while preserving current music and cue behavior.
- [x] 3.2 Remove direct `Phaser.Math` dependency from `src/game/simulation/GameSession.ts` by introducing engine-neutral numeric helpers or another compatibility-safe abstraction with matching behavior.
- [x] 3.3 Verify `SceneBridge` plus `GameSession` integration still preserves HUD synchronization, pause and resume flow, restart behavior, and stage completion transitions after the engine migration.

## 4. Validation

- [x] 4.1 Add or update targeted automated coverage for migrated boot, scene flow, audio compatibility, and simulation helper behavior where unit or integration tests are practical.
- [x] 4.2 Update `scripts/stage-playtest.mjs` as needed for Phaser 4 compatibility and run the existing automated playtest flow against the migrated runtime.
- [x] 4.3 Run `npm test` and the stage playtest workflow against the Phaser 4 migration, then resolve only the regressions required to satisfy the compatibility spec.