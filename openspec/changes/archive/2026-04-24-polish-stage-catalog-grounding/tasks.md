## 1. Catalog Audit And Correction

- [x] 1.1 Audit shipped grounded non-flying enemy entries in `src/game/content/stages/catalog.ts`, starting with obvious forest and sky support outliers from explore handoff.
- [x] 1.2 Correct only authored source coordinates needed to restore visible support contact for grounded non-flyers, without changing flyers, checkpoint data, floor hazards, or runtime grounding behavior.

## 2. Focused Regression Coverage

- [x] 2.1 Extend `src/game/content/stages.test.ts` with focused assertions that shipped grounded non-flying enemy catalog entries stay support-true and do not rely on tolerance-masked footing.
- [x] 2.2 Keep validation coverage scoped to catalog and grounded-enemy authoring, confirming no render-only or hidden-support patch is required.

## 3. Narrow Verification

- [x] 3.1 Run focused stage-content test coverage for the updated catalog and validation slice.
- [x] 3.2 Confirm changed OpenSpec artifacts stay aligned with the narrow grounded-enemy catalog-polish scope.