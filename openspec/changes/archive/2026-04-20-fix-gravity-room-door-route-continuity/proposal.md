## Why

The current gravity-room follow-up proves nearby named support and local overlap, but it does not yet prove true platform-path continuity through gravity-room doors. This change is needed so every current gravity room uses a real platform route into the entry door and out from the exit door, without floating doors or compliance-only helper ledges.

## What Changes

- Tighten the current gravity-room rollout contract from nearby doorway support to explicit platform-path continuity for both room entry and room exit.
- Require entry doors to be used from a real platform path and exit doors to deposit the player onto a real platform path, while still allowing fixed or moving support when that support is part of the intended route.
- Prohibit fake helper ledges or extra platforms whose only purpose is making door validation pass.
- Re-author the current gravity rooms as coordinated door, route-support, and route-rectangle updates so door placement and traversal geometry stay aligned.
- Keep runtime behavior changes out of scope unless validation or authoring support requires a minimal schema or helper adjustment.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: gravity-room route containment rules now require entry and exit doors to continue an actual platform path, including coordinated route-support and route-rectangle alignment for the current gravity-room rollout.
- `stage-progression`: gravity-room validation for the current rollout now rejects doors that only have local support overlap but do not function as true platform-path entry or exit continuity.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`.
- Expected implementation areas: `src/game/content/stages/builders.ts`, `src/game/content/stages/validation.ts`, `src/game/content/stages/types.ts`, and `src/game/content/stages/catalog.ts`.
- Expected test and verification areas: `src/game/content/stages.test.ts` plus focused gravity-room traversal playtests for `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule`.