---
title: 16-bit Graphics Upgrade
change: 2026-04-30-16bit-graphics
author: automated-copilot
---

## Summary

Convert the game's visual presentation toward a cohesive 16-bit aesthetic. This change applies a runtime 5-6-5 (R5-G6-B5) color quantization with Floyd–Steinberg dithering to procedurally generated pixel textures, and updates UI typography to a 16-bit styled pixel font.

## Goals

- Apply consistent 16-bit appearance across procedurally generated textures
- Preserve pixel-art crispness while adding richer 16-bit color character
- Provide a minimal, reversible change that does not require reauthoring all art

## What I changed

- Added 16-bit (5-6-5) quantization + Floyd–Steinberg dithering to runtime pixel texture creation: [src/phaser/assets/bootTextures.ts](src/phaser/assets/bootTextures.ts#L1)
- Imported `Press Start 2P` font and applied it to the UI: [index.html](index.html#L1), [src/styles/app.css](src/styles/app.css#L1)
 - Implemented a global camera postFX quantize + dither filter so externally-loaded images are also affected: [src/phaser/createGameApp.ts](src/phaser/createGameApp.ts#L1)
 - Added registry flag `globalQuantizeEnabled` so canvas textures skip double-quantization when the global postFX is active: [src/phaser/createGameApp.ts](src/phaser/createGameApp.ts#L1), [src/phaser/assets/bootTextures.ts](src/phaser/assets/bootTextures.ts#L1)

## Tasks

- [x] Inventory assets and sprite usage
- [x] Propose 16-bit approach and asset pipeline
- [x] Add quantization/dither step to runtime texture creation
- [x] Update font for HUD and UI
- [ ] Optionally extend quantization to externally-loaded images (follow-up)
- [ ] Visual smoke test and minor fixes
- [ ] Archive change

## Acceptance Criteria

- Game runs with no runtime errors in dev mode
- Procedurally created sprites show visible 16-bit quantization and dithering
- UI uses pixel font and remains readable

## Rollout / Follow-ups

- If desired, add batch asset processing script to convert source art to explicit 16-bit spritesheets.
- Consider adding a WebGL post-process pipeline (shader) to apply 16-bit look to all rendered content for parity with externally-loaded images.
