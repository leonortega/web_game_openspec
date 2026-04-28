## Why

The current campaign still authors brittle crystal and sticky sludge platforms in the three main stages even though those sections are no longer needed to teach or differentiate traversal. Those green-top terrain variants now create avoidable readability and maintenance cost, so the campaign should return those beats to normal platforms and stop requiring rollout or coverage that depends on live terrain-variant placements.

## What Changes

- Remove authored `brittleCrystal` and `stickySludge` placements from the current main-stage campaign content and replace those beats with normal static platforms that preserve the intended jump routes.
- Remove spec requirements that force main-stage brittle/sticky rollout minimums or verification paths that depend on live campaign terrain-variant sections.
- Keep platform-owned terrain-variant support, brittle/sticky runtime behavior, and legacy overlay rejection intact so the engine can still support those variants without the campaign depending on them.
- Retarget authored-data validation and scripted coverage so they no longer fail when the main campaign contains no brittle/sticky platforms, while preserving focused regression checks for platform-variant behavior where appropriate.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: remove the requirement that Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array broaden brittle/sticky rollout across multiple traversal beats.
- `stage-progression`: remove main-stage brittle/sticky rollout validation and live-stage verification expectations while keeping migration, reset, and legacy-overlay rejection coverage bounded to non-campaign fixtures.

## Impact

- Affects authored stage content in `src/game/content/stages/catalog.ts`.
- Affects stage acceptance checks in `src/game/content/stages/validation.ts`.
- Affects scripted coverage in `scripts/stage-playtest.mjs` and `scripts/stage-playtest-analysis.mjs`.
- Affects OpenSpec contracts in `openspec/specs/platform-variation/spec.md` and `openspec/specs/stage-progression/spec.md`.