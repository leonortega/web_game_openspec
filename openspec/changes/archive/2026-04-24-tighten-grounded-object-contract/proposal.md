## Why

Grounded-contact regressions are currently split across authored stage data, validation, runtime normalization, and render placement, which allows unsupported floor-bound objects to ship while runtime snap-to-ground behavior hides part of the drift. This change is needed now to re-establish one grounded-support contract for floor-bound gameplay objects and checkpoints so authored data, runtime behavior, and visual presentation stay aligned.

## What Changes

- Tighten the grounded-support contract for non-flying enemies and floor-bound hazards so authored placements must already sit flush on visible intended support.
- Extend that same grounded-support contract to checkpoints so the visible beacon base and respawn anchor resolve from the same authored support.
- Add reusable authored-flush-to-support validation and regression coverage for grounded stage objects instead of relying on per-render nudges or tolerant runtime normalization.
- Remove or narrow runtime snap-to-ground behavior for grounded gameplay entities where it currently masks unsupported authored placements.
- Preserve flyer and ovni hover behavior unchanged and reject fixes that force hovering actors onto floor support.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: strengthen grounded placement requirements for non-flying enemies and floor-bound hazards so unsupported placements are rejected instead of normalized or hidden by rendering.
- `stage-progression`: strengthen checkpoint grounding requirements so visible beacon footing and respawn anchoring share the same authored support contract.

## Impact

- `src/game/content/stages/builders.ts`
- `src/game/content/stages/validation.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/assets/bootTextures.ts`
- `src/phaser/assets/bootTextures.test.ts`
- `src/phaser/scenes/gameScene/enemyRendering.ts`
- `src/phaser/scenes/gameScene/rewardRendering.ts`
- `openspec/specs/enemy-hazard-system/spec.md`
- `openspec/specs/stage-progression/spec.md`