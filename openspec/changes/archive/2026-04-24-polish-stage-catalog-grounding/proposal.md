## Why

Grounded non-flying enemies in authored stage catalog have drifted off obvious support in several shipped layouts, with current runtime normalization tolerance masking part of problem instead of keeping source data clean. Need narrow catalog polish now so stage data again matches intended footing without broad runtime, render, or validator behavior changes.

## What Changes

- Audit and correct authored grounded non-flying enemy placements in stage catalog where source coordinates sit visibly above intended support.
- Keep scope to authored catalog polish for grounded enemies, with focus on obvious forest and sky outliers called out by explore handoff.
- Add focused coverage that fails when shipped catalog reintroduces grounded enemy source placements that depend on normalization tolerance instead of obvious authored support.
- Preserve flyer placements, checkpoint placements, floor-hazard behavior, render behavior, and current tolerance policy outside narrow grounded-enemy catalog checks needed for this audit.

## Capabilities

### New Capabilities

### Modified Capabilities
- `enemy-hazard-system`: tighten grounded non-flying enemy authoring so shipped catalog placements must already sit on readable intended support instead of relying on tolerant normalization to hide drift.

## Impact

- `src/game/content/stages/catalog.ts`
- `src/game/content/stages.test.ts`
- `openspec/specs/enemy-hazard-system/spec.md`