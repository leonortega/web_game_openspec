## 1. Campaign Authoring Cleanup

- [x] 1.1 Replace the brittle crystal and sticky sludge platform variants in `src/game/content/stages/catalog.ts` for Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array with normal static platforms that preserve the intended route geometry.
- [x] 1.2 Update any authored main-stage route expectations or nearby support geometry affected by those replacements so each changed section remains readable without terrain-variant behavior.

## 2. Validation And Coverage Realignment

- [x] 2.1 Remove campaign brittle/sticky rollout quota enforcement from `src/game/content/stages/validation.ts` and from `src/game/content/stages.test.ts` while preserving rejection of legacy overlay authoring and unsupported dynamic terrain variants.
- [x] 2.2 Retarget `scripts/stage-playtest.mjs` and `scripts/stage-playtest-analysis.mjs` so brittle/sticky verification runs against bounded non-campaign terrain-variant samples instead of assuming the three current main stages still contain those surfaces.
- [x] 2.3 Keep focused brittle/sticky regression coverage in targeted automated tests such as `src/game/simulation/state.test.ts` or other bounded fixtures so terrain-variant behavior remains protected after campaign removal.

## 3. Validation

- [x] 3.1 Run the focused authored-stage validation and test coverage that proves the current main stages no longer require brittle/sticky rollout, including the updated `src/game/content/stages.test.ts` expectations.
- [x] 3.2 Run the targeted terrain-variant regression and scripted coverage needed to confirm brittle/sticky behavior, readable presentation, and legacy overlay rejection still work outside the current main campaign stages.