# Add Parallax TileSprite Backgrounds

Summary

- Add parallax background layers implemented with `Phaser.GameObjects.TileSprite`.
- Create a small set of repeating textures (far / mid / near) using canvas-generated patterns so no external assets required.
- Create TileSprites in `createBaseDisplayObjects` so they are sized to the stage and positioned behind gameplay visuals.
- Scroll TileSprite `tilePositionX`/`tilePositionY` inside `GameScene.syncView()` based on camera world view at different speed factors.
- Clean up TileSprites on scene shutdown.

Motivation

- Parallax layers add depth and visual polish to platformer stages.
- Using `TileSprite` is efficient for repeated textures and allows easy scrolling by adjusting `tilePosition`.

Implementation details

- New spec will add three generated textures: `parallax-far`, `parallax-mid`, `parallax-near` (simple canvas patterns).
- Each layer gets a speed factor (e.g., 0.18, 0.36, 0.66) to produce depth.
- Layers use `setScrollFactor(0)` and are updated from camera world view.

Files changed

- `src/phaser/scenes/gameScene/bootstrap.ts` — create textures and TileSprites; expose on `scene.parallaxLayers`.
- `src/phaser/scenes/GameScene.ts` — add `parallaxLayers` field and update `syncView()` to scroll layers.
- `src/phaser/scenes/gameScene/bootstrap.ts` — ensure `GameSceneBaseDisplayContext` includes `parallaxLayers`.

Verification

- Build should succeed (`npm run build`).
- Visual check: parallax layers should visibly scroll at different speeds relative to player/camera.

