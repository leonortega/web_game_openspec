## Why

Stage catalog regressions have left many non-flying enemies, floor hazards, and some checkpoints visibly floating or detached from their intended support. This weakens the game's route language and encourages ad hoc offset fixes instead of preserving grounded placement as a core authored rule.

## What Changes

- Audit and correct authored stage catalog placements for grounded enemies, floor-bound hazards, and checkpoints that no longer sit on visible intended support.
- Introduce reusable grounded-placement guardrails in stage building, validation, and runtime setup so unsupported non-flyers and floor hazards are caught before they can ship.
- Align checkpoint placement and respawn anchoring to the same grounded-support contract used for visible beacon footing, rather than relying on independent Y corrections.
- Preserve hover-only semantics for flyers and reject fixes that depend on blanket offset fudges, invisible helper floors, render-only cheats, or globally loosened support tolerances.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: add grounded placement requirements and reusable guardrails for non-flying enemies and floor-bound hazards while explicitly excluding flyers from the new contract.
- `stage-progression`: strengthen checkpoint grounding requirements so visible beacon footing and respawn anchoring share the same authored support contract and reject offset-based cheats.

## Impact

- `src/game/content/stages/catalog.ts`
- `src/game/content/stages/builders.ts`
- `src/game/content/stages/validation.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/gameScene/bootstrap.ts`
- `src/phaser/scenes/gameScene/enemyRendering.ts`
- `src/phaser/scenes/gameScene/rewardRendering.ts`
- `openspec/specs/enemy-hazard-system/spec.md`
- `openspec/specs/stage-progression/spec.md`