## Context

Recent grounded-object guardrails improved checkpoints and some threats, but the explore handoff shows the repo still treats visible ground contact as a secondary concern in several places. Authored stage entries can remain slightly airborne, validation still accepts some categories as long as a support search eventually succeeds, runtime setup still snaps some grounded objects into place, and bootstrap or scene rendering still hides part of the mismatch through asset-bottom compensation. That split contract is now player-visible in floating checkpoints and grounded frogs that jump from nothing.

This change is diagnosis-first because the same symptom can come from different layers: bad authored coordinates in the catalog, tolerant support resolution in builders or validation, runtime fallback in `GameSession`, or art-bottom assumptions in bootstrap and rendering. The fix needs one support contract that starts from authored visible ground use, covers grounded enemies and floor-anchored static props, and leaves flyers explicitly outside that contract.

## Goals / Non-Goals

**Goals:**
- Treat player-visible grounded contact as the source of truth for grounded enemies, checkpoints, and floor-anchored static stage elements.
- Identify every in-scope grounded category that still depends on runtime or presentation compensation before narrowing those fallbacks.
- Reuse one authored-support resolution path across validation, runtime setup, respawn anchoring, and presentation checks.
- Keep hover enemies, flyers, and intentionally airborne content unchanged.

**Non-Goals:**
- Redesigning enemy AI, jump timing, patrol logic, or checkpoint progression rules beyond grounding semantics.
- Adding hidden helper floors, invisible support colliders, blanket Y offsets, or render-only nudges to make bad placements look grounded.
- Turning unsupported grounded actors into hovering actors or broadening support tolerances until the bug disappears.

## Decisions

### Decision: Start with grounded-support consumer audit before narrowing behavior

- Rationale: the affected files span authored content, validation, runtime, and rendering, so a diagnosis-first pass is needed to separate real source-data drift from fallback behavior that hides it.
- Alternative considered: patch the known checkpoint and frog placements directly first. Rejected because it risks leaving the same support gap in adjacent grounded props and future authored entries.

### Decision: Make authored visible support the only normal grounding authority for in-scope objects

- Rationale: visible route support is what the player reads, and the user intent explicitly rejects math-only passes that succeed without real grounded contact.
- Alternative considered: continue allowing support-search or snap-to-ground as a normal correction step after load. Rejected because it keeps bad catalog data shippable and makes regressions harder to catch.

### Decision: Share one support contract across checkpoints and other floor-anchored static props

- Rationale: checkpoints are one visible failure, but the same stage-content path also owns grounded route props, start or exit cabins, and other floor-anchored objects that should not drift independently.
- Alternative considered: scope static support rules only to checkpoints. Rejected because bootstrap and reward-rendering surfaces imply broader grounded-prop drift.

### Decision: Treat runtime and presentation grounding logic as validation backstops, not repair mechanisms

- Rationale: runtime setup and rendering may still need to report or assert grounded alignment, but they should not silently make unsupported source data appear correct.
- Alternative considered: preserve render and runtime compensation while adding tests around final pixels. Rejected because it would still allow authored placements that only look correct after compensation.

### Decision: Preserve flyer exemption explicitly

- Rationale: hover enemies and other flyers are intentionally not ground-bound, and the fix must not collapse their semantics into the grounded contract.
- Alternative considered: reuse grounded support checks for all enemies with opt-out exceptions later. Rejected because it invites accidental behavior changes for hover classes.

## Risks / Trade-offs

- [Risk] Shared visible-ground checks may surface many bad authored entries at once. → Mitigation: require category-specific diagnostics from catalog and validation so each failure points to exact stage object data.
- [Risk] Removing snap-to-ground too broadly could break legacy content that currently depends on it. → Mitigation: first audit in-scope grounded categories, then narrow fallback only for categories explicitly covered by the contract.
- [Risk] Asset-bottom tests can overfit sprite pixels instead of gameplay support. → Mitigation: keep bootstrap and rendering tests as regression confirmation only, not as the primary source of grounding truth.
- [Risk] Static-prop grounding rules could accidentally capture intentionally suspended blocks or airborne decor. → Mitigation: apply the contract only to categories authored as floor-anchored or route-grounded, and leave intentionally suspended content out of scope.

## Migration Plan

1. Audit grounded-support consumers in stage catalog, builders, validation, runtime setup, and bootstrap or render code to classify which categories are floor-anchored, grounded enemies, or exempt flyers.
2. Centralize visible-support resolution for grounded categories and update validation to fail authored entries that depend on hidden helpers, render-only offsets, snap fallback, or hover-like compensation.
3. Align runtime spawn, checkpoint respawn anchoring, and floor-anchored static-prop placement to that same support contract.
4. Update focused stage-content, simulation, and asset-bottom tests so unsupported grounded placements fail without requiring scripted or manual playtests.

## Open Questions

None.