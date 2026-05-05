## Context

Explore handoff points to authored stage catalog drift, not a render-path defect, as main cause of visibly floating grounded enemies. Current grounded-placement validation already rejects clearly unsupported non-flyers, but shipped catalog can still hide small source-coordinate drift behind tolerant normalization. This change stays narrow: repair authored grounded non-flying enemy coordinates in catalog and add focused regression coverage without broad validator tightening or runtime placement changes.

## Goals / Non-Goals

**Goals:**
- Correct shipped grounded non-flying enemy source placements that sit visibly off obvious support.
- Keep authored stage catalog as source of truth for grounded enemy footing.
- Add focused automated coverage that catches tolerance-masked grounded-enemy drift in shipped catalog.

**Non-Goals:**
- Tightening global grounded-support tolerance or rewriting validator heuristics.
- Changing flyers, checkpoints, floor hazards, or render-only placement behavior.
- Adding hidden support, helper floors, or broader runtime grounding adjustments.

## Decisions

- Fix issue in `src/game/content/stages/catalog.ts` first, not in runtime rendering or normalization.
  - Rationale: explore handoff already narrows culprit to authored source data, and catalog corrections remove visible drift at root.
  - Alternative considered: render-only sprite nudges. Rejected because they would preserve bad source data and hide future regressions.

- Add regression coverage in existing stage validation tests for shipped grounded non-flying enemy placements.
  - Rationale: `src/game/content/stages.test.ts` already owns stage authoring guardrails, so catalog-footing assertions belong there.
  - Alternative considered: rely on manual catalog audit only. Rejected because same drift could re-enter quietly.

- Preserve current normalization tolerance and validator policy in this change.
  - Rationale: user asked for narrow catalog polish first; broader tolerance tightening is optional later follow-up if residual drift remains.
  - Alternative considered: tighten tolerance immediately. Rejected because it expands scope and may create unrelated fallout across already-shipped data.

## Risks / Trade-offs

- [Risk] Narrow audit may miss one grounded enemy outlier outside obvious forest and sky suspects. -> Mitigation: cover shipped grounded non-flying enemy placements through focused catalog validation tests, not only spot fixes.
- [Risk] Current tolerant normalization can still permit future borderline drift beyond this change's covered cases. -> Mitigation: keep tests explicit about source-authored support truth and leave tolerance tightening as separate follow-up if needed.
- [Risk] Small coordinate corrections may subtly affect patrol start spacing. -> Mitigation: limit edits to support-alignment corrections and avoid behavior changes beyond grounding.

## Migration Plan

1. Audit shipped grounded non-flying enemy entries in catalog, focusing first on forest and sky placements called out in explore handoff.
2. Correct only authored source coordinates needed for obvious support contact.
3. Add or extend focused stage validation tests so shipped catalog fails if grounded non-flyers depend on tolerance-masked footing.
4. Run narrow stage-content test coverage for the updated catalog and validation slice.

## Open Questions

None.