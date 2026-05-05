## Why

The game currently depends on Phaser 3.90 and several Phaser 3-specific APIs across boot, scenes, audio, and simulation touchpoints. Migrating now keeps the runtime on the current engine line, reduces future engine-locking debt, and preserves the existing gameplay contract before more authored content accumulates on top of the old renderer and lifecycle behavior.

## What Changes

- Upgrade the browser runtime from Phaser 3 to Phaser 4 while preserving the current single-canvas game shell, scene order, scale behavior, and gameplay flow.
- Migrate the Phaser adapter and scene layer for Phaser 4 boot/config, lifecycle, camera, and transition behavior without changing current OpenSpec gameplay contracts.
- Replace Phaser 3-only APIs called out in exploration, including MenuScene GeometryMask usage, BootScene runtime Graphics texture generation, and direct sound-manager context access in SynthAudio.
- Decouple simulation and automation touchpoints from Phaser 3-only helpers where needed, especially GameSession math helper usage and the stage playtest boot path.
- Allow only one narrow compatibility adjustment if required by Phaser 4 migration constraints: the supported browser runtime may become WebGL-backed instead of relying on Phaser 3's current AUTO plus Canvas fallback behavior.

## Capabilities

### New Capabilities

- `phaser-4-runtime-compatibility`: defines the bounded engine migration contract for Phaser 4 boot, rendering, audio, simulation, and playtest compatibility while preserving current gameplay behavior.

### Modified Capabilities

None.

## Impact

- `package.json`
- `src/phaser/createGameApp.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/MenuScene.ts`
- `src/phaser/scenes/StageIntroScene.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/CompleteScene.ts`
- `src/phaser/audio/SynthAudio.ts`
- `src/phaser/view/camera/configureCamera.ts`
- `src/game/simulation/GameSession.ts`
- `scripts/stage-playtest.mjs`
- Targeted tests that cover scene flow, migrated helpers, and playtest compatibility