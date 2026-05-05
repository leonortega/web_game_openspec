## Why

The current main stages still use `brittleCrystal` and `stickySludge` on green-top authored platforms even though those routes should now read as plain support. Leaving terrain mechanics hidden under normal-looking platforms weakens traversal readability and keeps campaign validation and playtests tied to a terrain concept the user no longer wants in those stages.

## What Changes

- Remove authored `brittleCrystal` and `stickySludge` usage from green-top platforms in the current main-stage catalog and replace those sections with plain static platforms that preserve route shape.
- Update stage validation and scripted coverage so the main campaign no longer depends on brittle/sticky presence in Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array.
- Keep brittle/sticky engine support, platform-owned terrain-variant authoring, legacy overlay rejection, and targeted regression coverage outside those main-stage routes.
- Require main-stage plain green platforms to behave as plain support instead of hiding brittle/sticky mechanics under unchanged normal-platform presentation.
- Keep launcher, spring, gas vent, gravity, and other non-terrain traversal distinctions unchanged.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: current main-stage green-top traversal surfaces stop using brittle/sticky terrain variants, and normal-looking platforms must not hide those terrain mechanics.
- `stage-progression`: main-stage validation and scripted verification stop expecting campaign brittle/sticky rollout while targeted non-campaign terrain-variant regression coverage remains required.

## Impact

- Affects authored stage content in `src/game/content/stages/catalog.ts`.
- Affects stage validation and authoring tests for platform terrain usage.
- Affects scripted playtest coverage and any terrain-rollout assertions tied to the current main stages.
- Affects OpenSpec contracts in `openspec/specs/platform-variation/spec.md` and `openspec/specs/stage-progression/spec.md`.