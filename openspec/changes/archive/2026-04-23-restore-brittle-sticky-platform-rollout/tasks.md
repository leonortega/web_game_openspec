## 1. Restore Main-Stage Terrain Variant Authoring

- [x] 1.1 Add new or revised full-platform `terrainVariant` placements in `src/game/content/stages/catalog.ts` so Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array each contain at least one visible brittle or sticky beat that fits the current shipped routes.
- [x] 1.2 Keep every restored beat on supported static platforms only and preserve current brittle and sticky semantics, readable visuals, and route safety without reintroducing legacy overlay data or pretending archived coordinates are authoritative.

## 2. Realign Validation And Automated Coverage

- [x] 2.1 Update `src/game/content/stages/validation.ts` so authored-stage rules and error messages enforce restored live main-stage brittle or sticky rollout instead of campaign-wide terrain-variant absence.
- [x] 2.2 Update `src/game/content/stages.test.ts` so automated stage expectations require live brittle or sticky participation in all three main stages and confirm combined campaign rollout still includes both `brittleCrystal` and `stickySludge`.
- [x] 2.3 Update any bounded automated analysis helper, such as `scripts/stage-playtest-analysis.mjs`, only if it still encodes zero-main-stage terrain-variant assumptions that would conflict with the restored rollout contract.

## 3. Focused Verification

- [x] 3.1 Run focused authored-stage validation and automated tests that prove the restored main-stage catalog now contains visible brittle or sticky rollout in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array.
- [x] 3.2 Run the narrow terrain-variant regression coverage needed to confirm brittle warning or break or reset readability and sticky grounded-drag-only behavior still match current specs after the main-stage rollout is restored.