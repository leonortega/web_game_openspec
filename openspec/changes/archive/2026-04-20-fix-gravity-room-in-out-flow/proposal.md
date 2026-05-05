## Why

The current enclosed gravity-room validator can still accept layouts that are technically reachable but experientially wrong because the player-facing doorway flow does not clearly read as left-side room entry and right-side room exit. This change is needed now to lock a room-by-room proposal for the four current gravity rooms before implementation so apply work removes or demotes the wrong yellow-marked doorway arrangements instead of preserving them through another false-positive pass.

## What Changes

- Define proposal-first room-by-room scope for the four current enclosed gravity rooms: `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule`.
- Make `IN` mean left-side room entry and `OUT` mean right-side room exit for this rollout, and require the proposal plus later implementation to preserve that player-facing read for every current gravity room.
- Distinguish geometry that may remain from geometry that may no longer count as doorway flow, so an existing platform or door arrangement can stay only if it stops acting as the solution for room entry or exit.
- Require room-by-room keep, remove, move, and forbid semantics that explicitly preserve the enclosed-room model, gravity field, interior disable button, and reset behavior while removing wrong yellow-marked doorway solutions.
- Define an explicit anti-goal: a code or spec pass is not acceptable if the player-facing IN-to-OUT flow is still wrong, even if validation can technically accept the layout.
- Keep the change proposal-only and apply-ready by capturing the authoring, validation, and verification requirements without implementing them yet.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: enclosed gravity-room rollout requirements now need room-by-room IN/OUT authoring semantics for the four current gravity rooms, including what must be kept, moved, removed, or forbidden as doorway solutions.
- `stage-progression`: gravity-room validation and route acceptance now need to reject technically passable but player-facing wrong IN/OUT flow for the four current gravity rooms.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`.
- Expected implementation areas: gravity-room authoring and validation in `src/game/content/stages/catalog.ts`, `src/game/content/stages/builders.ts`, and `src/game/content/stages/validation.ts`.
- Expected verification areas: `src/game/content/stages.test.ts` plus focused gravity-room playtests that check left-entry and right-exit readability for forest, amber, sky anti-grav, and sky inversion rooms.