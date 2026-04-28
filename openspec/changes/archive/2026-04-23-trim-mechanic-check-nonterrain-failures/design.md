## Context

The current broad report for `unify-launch-platforms-as-springs` shows `Mechanic Checks` failing in two non-terrain areas even though nearby source-of-truth surfaces already describe the shipped behavior differently. The falling-platform jump probe in `scripts/stage-playtest.mjs` appears to encode an older helper-side jump-input contract, while the runtime controller truth is covered by `src/game/simulation/GameSession.test.ts`, including the escape-jump interaction between falling-platform support and gravity inversion. The gravity-field readability probe also appears stale: it still relies on a relative-alpha comparison that no longer matches the current live-scene styling and debug-snapshot contract in `src/phaser/view/gameSceneStyling.ts` and `src/phaser/scenes/GameScene.ts`.

This is a cross-cutting validation change rather than a gameplay change. The implementation will likely touch the broad helper, controller-facing test anchors, and gravity-field scene inspection logic, but it should not change runtime traversal behavior or terrain-variant heuristics.

## Goals / Non-Goals

**Goals:**
- Remove the stale non-terrain `Mechanic Checks` failures for falling-platform escape jumps and gravity-field readability.
- Make the broad helper derive expectations from current shipped controller and renderer contracts instead of stale duplicated heuristics.
- Keep the change narrowly scoped so terrain-variant extents drift and brittle or sticky readability drift remain untouched.
- Leave the broad report more trustworthy for future helper work by separating real regressions from helper drift.

**Non-Goals:**
- Changing falling-platform, gravity-field, or room traversal runtime behavior.
- Reworking terrain-variant checks, brittle warnings, sticky traversal penalties, or other terrain-related false failures.
- Redesigning the entire broad helper bundle or replacing the full reporting format.
- Adding new mechanics, renderer features, or scene-debug systems.

## Decisions

### Decision: Use runtime controller coverage as the falling-platform probe source of truth
The broad helper should stop carrying an independent jump-timing interpretation for the falling-platform escape-jump case and instead mirror the controller contract already exercised by `GameSession` runtime tests.

Rationale:
- The current false failure exists because helper logic drifted away from the controller contract.
- Runtime tests already cover the high-value composition between falling-platform support and gravity inversion.
- One source of truth is safer than keeping two subtly different interpretations of jump sequencing.

Alternatives considered:
- Retune the helper thresholds without referencing runtime tests: rejected because that can still preserve the wrong contract under a different constant.
- Change runtime behavior to match the stale helper: rejected because explore found the helper, not the game, is stale.

### Decision: Use live-scene renderer signals for gravity-field readability
The gravity-field readability check should evaluate the live scene through the current styling and debug-snapshot contract instead of an older relative-alpha heuristic.

Rationale:
- Gravity-field presentation now depends on the current renderer contract, not the old helper-side alpha comparison.
- The live scene and debug snapshot expose the semantics the helper actually needs to validate: readable bounded field presence and distinction from neighboring mechanics.
- This keeps the helper aligned with how the shipped scene is rendered instead of with an implementation detail that already moved.

Alternatives considered:
- Loosen the old relative-alpha threshold until the failure disappears: rejected because it preserves a stale measurement model.
- Remove gravity-field readability coverage from the broad helper: rejected because the coverage itself is still valuable.

### Decision: Keep terrain drift out of scope and preserve report separation
This change should trim only the two non-terrain false failures and leave terrain-related failures visible and untouched.

Rationale:
- Explore already identified terrain drift as a separate cleanup slice.
- Mixing terrain fixes into this change would widen scope and make validation less discriminating.
- Keeping terrain failures visible preserves signal for the later follow-up change.

Alternatives considered:
- Fold all `Mechanic Checks` false failures into one broad cleanup: rejected because it mixes unrelated controller, renderer, and terrain issues.

## Risks / Trade-offs

- [Broad helper could drift again if controller tests and helper expectations are still copied manually] → Anchor the probe to the same observable contract and reuse existing runtime-test semantics where practical.
- [Gravity readability checks could become too tied to scene-debug output shape] → Limit the probe to stable renderer-facing signals that reflect the shipped visual contract, not incidental debug formatting.
- [Narrowing scope may leave the broad report still failing on terrain issues] → Keep those failures explicit and unchanged so this change removes only the known non-terrain noise.