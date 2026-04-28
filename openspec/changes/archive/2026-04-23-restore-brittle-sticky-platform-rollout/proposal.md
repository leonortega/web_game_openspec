## Why

Current shipped campaign stages no longer contain any live `brittleCrystal` or `stickySludge` platform variants even though engine, renderer, and specs still support those authored behaviors. This change restores readable in-campaign brittle and sticky platform use so the main stage catalog again exercises those terrain variants instead of leaving them confined to non-campaign fixtures.

## What Changes

- Restore live authored `brittleCrystal` and `stickySludge` platform variants to Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array using new or revised authored placements that fit the current shipped routes.
- Keep brittle and sticky terrain bounded to full static-platform `terrainVariant` authoring only, with no return of legacy terrain overlays, partial rectangles, or dynamic-platform combinations.
- Preserve current brittle warning, delayed break, fair-support-at-expiry, and reset semantics, and preserve current sticky grounded-drag-only behavior without reintroducing any sticky jump-nerf semantics.
- Replace current spec and automated validation expectations that require zero live main-stage terrain variants with requirements that restore readable brittle/sticky rollout across the three shipped main stages.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: restore main-stage brittle/sticky rollout requirements for Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array while keeping full-platform static-variant-only authoring and readable presentation rules.
- `stage-progression`: restore verification expectations so authored-data checks and automated coverage confirm live main-stage brittle/sticky rollout instead of enforcing campaign absence.

## Impact

- Affects stage catalog authoring in `src/game/content/stages/catalog.ts` and nearby stage builders or helpers that own current shipped platform placements.
- Affects authored-stage validation in `src/game/content/stages/validation.ts` and automated expectations in `src/game/content/stages.test.ts` that currently assume zero live main-stage terrain variants.
- May affect focused automated or scripted terrain-rollout reporting in `scripts/stage-playtest-analysis.mjs` or equivalent verification helpers if they still encode post-removal assumptions.
- Affects OpenSpec contracts in `openspec/specs/platform-variation/spec.md` and `openspec/specs/stage-progression/spec.md`.