## Why

Current platform-surface authoring is split across two models. `brittleCrystal` and `stickySludge` already live on static platforms, while `bouncePod` and `gasVent` still depend on separate launcher collections and launcher-specific runtime state. That split keeps stage authoring inconsistent, leaves OpenSpec contracts in conflict, and pushes support-platform launch beats toward spring substitutions instead of platform-native bounce or gas behavior.

User wants one platform-authored static-surface model for `brittleCrystal`, `stickySludge`, `bouncePod`, and `gasVent`, plus live rollout on static platforms in multiple shipped stages. This proposal updates the OpenSpec contract so apply can unify those mechanics without preserving `stage.launchers` as source of truth and without collapsing bounce pods or gas vents into spring behavior.

## What Changes

- Replace bounce-pod and gas-vent launcher-source-of-truth wording with one platform-owned static-platform surface-mechanic contract shared with brittle crystal and sticky sludge.
- Update platform-variation rules so bounce pods and gas vents are expected as full-footprint static-platform-authored beats with their own single-impulse, cooldown, and optional directional-bias behavior.
- Update stage-progression rules so validation, runtime setup, and regression coverage reject legacy bounce-pod or gas-vent launcher annotations as authoritative shipped-stage authoring and instead require platform-owned source data.
- Require current shipped main-stage rollout to include platform-authored `bouncePod` and `gasVent` beats on static platforms across multiple stages while preserving existing live brittle and sticky rollout.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: unify static-platform surface mechanics for brittle crystal, sticky sludge, bounce pods, and gas vents, and require live platform-authored rollout across multiple stages.
- `stage-progression`: replace launcher-era validation and verification expectations with platform-owned bounce-pod and gas-vent authoring, readiness reset rules, and rollout coverage.

## Impact

- `src/game/content/stages/types.ts`
- `src/game/content/stages/builders.ts`
- `src/game/content/stages/catalog.ts`
- `src/game/content/stages/validation.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- Rendering, audio, and regression fixtures that still branch on launcher-owned bounce-pod or gas-vent authoring
- `openspec/specs/platform-variation/spec.md`
- `openspec/specs/stage-progression/spec.md`