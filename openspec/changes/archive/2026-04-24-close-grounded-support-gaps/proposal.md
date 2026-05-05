## Why

Grounded-contact regressions still slip through because authored stage data, validation, runtime spawn setup, and presentation each decide support slightly differently. The current gap is visible now in floating checkpoints and frogs that look airborne before jumping, so this change needs to force one diagnosis-first visible-ground contract across grounded enemies and floor-anchored static stage elements before more content drift accumulates.

## What Changes

- Audit every floor-anchored gameplay object and static stage element touched by the grounded-support pipeline, starting from authored catalog data and the bootstrap or render paths that currently hide bad placements.
- Tighten shared stage-building and validation rules so grounded enemies, checkpoints, and floor-anchored static props must already use real visible support in source data.
- Narrow runtime snap-to-ground and presentation compensation so unsupported placements are reported instead of silently corrected.
- Preserve existing flyer and hover-only behavior, and reject fixes that rely on hidden helper support, render-only Y nudges, or hover fallback for grounded actors.
- Add focused regression coverage around stage catalog validation, runtime setup, and grounded asset bottoms so future airborne-looking placements fail automatically.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: strengthen grounded-enemy and floor-hazard rules so visible ground contact in authored data is the source of truth and grounded hoppers cannot begin from unsupported placements.
- `stage-progression`: strengthen checkpoint grounding so visible beacon footing, respawn anchoring, and other floor-anchored route props stay tied to the same authored support contract.
- `stage-layout-safety`: require floor-anchored static stage elements to rest on visible authored support instead of floating on catalog drift, hidden helpers, or presentation-only compensation.

## Impact

- `src/game/content/stages/builders.ts`
- `src/game/content/stages/validation.ts`
- `src/game/content/stages/catalog.ts`
- `src/game/content/stages/stages.test.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/assets/bootTextures.ts`
- `src/phaser/assets/bootTextures.test.ts`
- `src/phaser/scenes/gameScene/rewardRendering.ts`
- `openspec/specs/enemy-hazard-system/spec.md`
- `openspec/specs/stage-progression/spec.md`
- `openspec/specs/stage-layout-safety/spec.md`