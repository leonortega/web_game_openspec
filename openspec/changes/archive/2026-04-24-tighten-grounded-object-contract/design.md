## Context

Grounded placement for floor-bound gameplay objects is currently split across authored stage coordinates, stage validation, stage-building helpers, runtime spawn normalization, and render-space adjustments. The recent enemy and checkpoint grounding fixes improved some symptoms, but the explore handoff shows that the broader contract is still inconsistent: some authored placements remain bad in source data, validation still focuses more on support existence than authored flush contact, runtime snap-to-ground still masks some drift, and asset or render alignment tests such as `bootTextures.test.ts` only cover one slice of the problem. This change needs a single grounded-support contract that spans authored data, validation, runtime setup, and presentation for floor-bound enemies, hazards, checkpoints, and comparable grounded props while leaving flyers and ovni behavior unchanged.

## Goals / Non-Goals

**Goals:**
- Treat authored visible support as the source of truth for floor-bound gameplay object placement.
- Add reusable authored-flush-to-support checks that can validate grounded enemies, floor hazards, checkpoints, and remaining grounded props that still rely on normalization.
- Narrow or remove runtime snap-to-ground behavior for grounded entities so unsupported source data fails instead of being silently corrected.
- Keep checkpoint visuals and respawn anchoring tied to the same resolved support.
- Use existing boot-texture bottom-edge tests as a regression anchor without letting art alignment become the primary fix path.

**Non-Goals:**
- Changing flyer, hover-enemy, or ovni movement and placement semantics.
- Solving grounded presentation issues through render-only Y nudges, hidden support geometry, or looser support tolerances.
- Expanding into unrelated enemy AI, combat balance, or checkpoint progression behavior.

## Decisions

- Resolve grounded support from authored stage support first, then reuse that contract everywhere it matters.
  - Rationale: source data, validation, runtime setup, and rendering currently disagree because they derive grounding in different ways.
  - Alternative considered: keep runtime normalization as the final authority. Rejected because it hides invalid authored data and weakens regression detection.

- Introduce reusable authored-flush assertions for grounded stage objects instead of relying on isolated content-specific checks.
  - Rationale: the user intent explicitly calls for broader contract coverage beyond the current enemy and checkpoint slices.
  - Alternative considered: add a few more one-off assertions around existing enemy and checkpoint tests. Rejected because it would miss remaining grounded props and allow future drift in adjacent categories.

- Treat runtime snap-to-ground for grounded gameplay entities as a narrow compatibility fallback to remove or constrain, not as a normal repair path.
  - Rationale: unsupported placements should fail near authoring and validation boundaries, not be corrected after load.
  - Alternative considered: preserve current normalization and only add more tests. Rejected because tests would keep passing while bad source data still shipped.

- Keep `bootTextures.test.ts` as an asset anchor only.
  - Rationale: bottom-edge sprite coverage can confirm visible contact expectations for grounded classes, but it cannot prove authored stage placements or respawn anchors are correct by itself.
  - Alternative considered: fix this change only in `bootTextures.ts` and related rendering. Rejected because that is one of the false-positive solutions identified in the explore handoff.

- Tie checkpoint beacon footing and respawn anchor to the same support resolution path.
  - Rationale: checkpoint visuals and recovery semantics must agree on the same stable route support.
  - Alternative considered: keep a separate respawn-only correction after checkpoint art is grounded. Rejected because it preserves contract drift and can still create unsafe or visually misleading checkpoint recovery.

## Risks / Trade-offs

- [Risk] Tightened guardrails may surface many invalid grounded placements across shipped content. → Mitigation: structure checks so failures report the exact stage object category and authored entry that must be corrected.
- [Risk] Removing runtime normalization too aggressively could break legitimate edge cases that were authored against the old behavior. → Mitigation: narrow normalization only for floor-bound categories covered by the contract and keep flyers exempt.
- [Risk] Shared flush-to-support assertions may overfit to current support geometry assumptions. → Mitigation: derive assertions from intended support contact rules already used by validation instead of hard-coding sprite-specific offsets.
- [Risk] Checkpoint grounding updates may expose mismatches between visual beacon placement and respawn safety. → Mitigation: validate both visible footing and respawn anchoring through the same support-resolution helper and runtime tests.

## Migration Plan

1. Identify grounded object categories that currently depend on runtime or render normalization, starting from the existing boot texture and stage grounding tests.
2. Build shared authored-flush validation and test helpers for grounded enemies, floor hazards, checkpoints, and remaining grounded props in scope.
3. Update runtime setup so grounded categories use the authored support contract directly and fail or report when unsupported instead of silently snapping.
4. Adjust authored data or asset/render alignment only where the new contract exposes real drift, then run focused tests for asset bottoms, stage validation, and runtime grounding.

## Open Questions

None.