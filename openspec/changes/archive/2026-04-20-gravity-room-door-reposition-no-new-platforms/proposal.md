## Why

The side-aware gravity-room door rules are now in main specs, but the latest room re-authoring partly satisfied them by adding extra support platforms. This follow-up is needed to keep current gravity rooms aligned with the intended route language: entry on the left, exit on the right, with doors repositioned onto existing usable supports instead of introducing dedicated helper footing.

## What Changes

- Tighten current gravity-room rollout requirements so door-side compliance is satisfied by repositioning entry and exit openings onto already-authored route-support platforms or moving supports.
- Prohibit adding dedicated extra support platforms whose sole purpose is to satisfy enclosed gravity-room door-side rules in the current gravity-room rollout.
- Re-author the current affected gravity rooms so left-side entry and right-side exit reuse existing support geometry, with coordinated route rectangle updates where needed.
- Preserve authored validation coverage for fixed-platform and moving-platform doorway support while adding coverage for the no-new-helper-platform constraint.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: current enclosed gravity-room rollout now requires door relocation onto existing route-support platforms and forbids dedicated helper platforms added only for door-side compliance.
- `stage-progression`: authored gravity-room validation for the current rollout now expects entry and exit doors to stay on intended reachable route supports without relying on dedicated extra doorway-only support additions.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`.
- Expected implementation areas: gravity-room authoring and validation in `src/game/content/stages/catalog.ts`, `src/game/content/stages/builders.ts`, and `src/game/content/stages/validation.ts`.
- Expected test and verification areas: `src/game/content/stages.test.ts` plus targeted gravity-room playtests covering forest, amber, and sky room traversal after door relocation.