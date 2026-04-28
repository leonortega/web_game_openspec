## Context

The current campaign still carries brittle crystal and sticky sludge platform variants in the three main authored stages, and current stage acceptance plus scripted coverage still assume those live placements exist. The request is narrower than a terrain-system rollback: the engine may keep supporting platform-owned terrain variants and legacy overlay rejection, but the main campaign should stop depending on brittle/sticky sections for route readability, validation, or automated verification.

The apply work will cross authored stage data, stage validation, and scripted coverage together. Those surfaces must move in one pass so the campaign can load cleanly without brittle/sticky placements while regression checks for the underlying terrain-variant capability still remain available outside the main-stage rollout.

## Goals / Non-Goals

**Goals:**
- Replace main-stage brittle/sticky authored platforms with normal static platforms while preserving the intended jump lines and route pacing.
- Remove campaign-specific brittle/sticky rollout quotas from validation and OpenSpec requirements.
- Retarget scripted verification so terrain-variant coverage no longer depends on the three current main stages.
- Preserve platform-owned terrain-variant support, brittle/sticky runtime behavior, and legacy terrain-surface rejection.

**Non-Goals:**
- Removing brittle/sticky support from the engine, renderer, controller, or validation model entirely.
- Reintroducing legacy `terrainSurface` overlays or weakening their rejection path.
- Rebalancing unrelated stage hazards, enemy routes, gravity sections, or movement rules outside the replaced platform beats.
- Generalizing new fallback authoring systems beyond ordinary static-platform replacements.

## Decisions

### 1. Replace authored campaign variant placements in place with equivalent normal platforms

Apply should update the existing brittle/sticky platform placements in the main-stage catalog to ordinary static platforms with the same footprints unless a small local geometry adjustment is required to preserve route readability. This keeps the authored route shape stable while removing the terrain-specific behavior.

Alternative considered: removing those sections outright and rebuilding nearby traversal from scratch. Rejected because it broadens the change beyond de-authoring terrain variants and risks unnecessary route churn.

### 2. Remove campaign rollout enforcement instead of swapping it for a weaker terrain quota

The current validation rule that enforces per-stage brittle/sticky minimums should be deleted rather than replaced with a softer requirement. Once the campaign no longer depends on terrain variants, stage acceptance should not encode any terrain-variant quota for the current main stages.

Alternative considered: keeping a reduced minimum such as one brittle and one sticky placement per stage. Rejected because it preserves the same dependency the user asked to remove.

### 3. Keep terrain-variant regression coverage, but move it off the main campaign

Scripted or automated checks for brittle readability, sticky readability, brittle reset, and legacy overlay rejection should remain, but they should run against bounded fixtures, targeted samples, or other non-campaign authored surfaces rather than assuming the campaign stages still contain brittle/sticky sections.

Alternative considered: dropping all terrain-variant coverage because the campaign no longer uses it. Rejected because the engine still supports the capability and still needs regression protection.

## Risks / Trade-offs

- [Route drift] Replacing special platforms with normal ones could accidentally shorten or flatten a traversal beat too much. -> Mitigation: preserve existing platform footprints by default and validate the affected routes with focused authored-data or scripted checks.
- [Coverage gap] Removing campaign rollout checks could hide regressions in brittle/sticky behavior if no targeted replacement coverage remains. -> Mitigation: keep explicit fixture or sample-based regression coverage for brittle, sticky, and legacy-overlay rejection.
- [Scope leak] Apply could start deleting runtime terrain-variant support because the campaign no longer uses it. -> Mitigation: keep proposal and spec text explicit that engine support and defensive validation stay in place.

## Migration Plan

1. Update OpenSpec deltas so campaign-stage terrain rollout is no longer required, while terrain-variant capability and targeted verification remain defined.
2. During apply, replace the main-stage brittle/sticky platform variants in `src/game/content/stages/catalog.ts` with normal platforms that preserve route shape.
3. Remove campaign-specific terrain rollout checks from `src/game/content/stages/validation.ts`.
4. Retarget scripted coverage in `scripts/stage-playtest.mjs` and `scripts/stage-playtest-analysis.mjs` so brittle/sticky verification uses bounded non-campaign samples or fixtures.
5. Run the focused authored-data and scripted validation that proves the campaign no longer depends on terrain variants while terrain-variant regression coverage still exists.

## Open Questions

No proposal-stage blocker remains. Apply can choose the exact non-campaign fixture or targeted sample used for terrain-variant verification as long as campaign stages no longer carry that dependency.