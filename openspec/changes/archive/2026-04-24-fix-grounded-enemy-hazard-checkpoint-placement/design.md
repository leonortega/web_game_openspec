## Context

Grounded placement for threats and checkpoint props is currently decided by a mix of authored stage coordinates, stage-build normalization, validation heuristics, runtime spawning, and scene rendering. The explore handoff points to stage catalog regression rather than a broad render-origin bug, so the fix must first repair authored data and then harden reusable guardrails around the existing support contract. The change spans content authoring, validation, simulation spawn setup, and scene presentation, but it must preserve the current hover-only behavior for flyers and must not introduce hidden support geometry or render-only nudges.

## Goals / Non-Goals

**Goals:**
- Restore visible grounded placement for non-flying enemies, floor hazards, and checkpoints on intended authored support.
- Make authored support the single source of truth for placement validation, spawn normalization, and checkpoint respawn anchoring.
- Prevent the same regression from re-entering through reusable validation and focused automated coverage.
- Keep flyers unchanged and avoid converting grounded actors into hover-like entities.

**Non-Goals:**
- Redesigning enemy AI, patrol logic, or checkpoint gameplay semantics.
- Adding hidden helper floors, invisible support colliders, or broad render-layer offsets.
- Loosening support tolerances globally so unsupported placements merely pass validation.

## Decisions

- Use authored visible support as placement source of truth across content, validation, runtime, and rendering.
  - Rationale: the bug is content regression with weak guardrails, so one shared support contract is more reliable than scattered corrective offsets.
  - Alternative considered: patch only scene rendering offsets. Rejected because it would hide unsupported content without fixing simulation or future authoring.

- Repair current catalog placements directly while also adding reusable validation and setup checks for future stage edits.
  - Rationale: current content needs correction now, and validation must prevent recurrence.
  - Alternative considered: validation-only fix. Rejected because current shipped stages would remain visibly wrong until separately audited.

- Keep unsupported grounded threats as authoring/validation failures, not hover fallbacks.
  - Rationale: floor contact is part of the movement and readability contract for non-flyers and floor hazards.
  - Alternative considered: auto-promote unsupported placements into hovering or relaxed support states. Rejected because it changes behavior and obscures bad content.

- Make checkpoint respawn anchoring derive from the same support contract as the visible beacon base.
  - Rationale: checkpoint visuals and respawn safety must agree on where the route actually stands.
  - Alternative considered: retain separate respawn-only Y correction after visual grounding fixes. Rejected because it allows beacon and respawn locations to drift apart.

## Risks / Trade-offs

- [Risk] Tightened grounded-support checks may fail more authored placements than expected across the catalog. → Mitigation: audit and fix current stage data in the same change, then keep failures specific and actionable.
- [Risk] Shared support rules may expose disagreement between simulation spawn anchors and scene sprite placement. → Mitigation: update spawn/setup and scene projection together, and add focused tests around resolved world positions.
- [Risk] Checkpoint grounding fixes may move some beacon positions enough to affect route pacing. → Mitigation: keep corrections local to intended route support and verify the served checkpoint progression still matches authored flow.
- [Risk] Overly narrow guardrails could miss a future unsupported pattern. → Mitigation: cover enemies, hazards, and checkpoints through reusable validation helpers rather than one-off fixture assertions.

## Migration Plan

1. Audit stage catalog placements for affected grounded enemies, hazards, and checkpoints, then correct unsupported authored coordinates.
2. Centralize grounded-support checks in builders and validation so unsupported placements fail before runtime use.
3. Align runtime spawn and scene placement for grounded threats and checkpoints to the same resolved support positions.
4. Add focused validation and runtime tests that catch unsupported catalog regressions without requiring scripted playtests.

## Open Questions

None.