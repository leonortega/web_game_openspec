## Context

The enclosed gravity-room rollout already exists across the current playable gravity rooms, but its contract is split across multiple places that still assume bottom openings. The main platform spec names bottom entry and exit doors. The stage-progression validation contract names bottom-side reachability and false positives around wrong flow without explicitly banning bottom-edge remnants. The presentation spec also still describes bottom door openings. In implementation, gravity-room builders and runtime containment logic derive sealed shell behavior from bottom-span helpers, and the current simulation tests probe sealed bottom midpoints rather than a generalized wall-opening model.

This change is therefore not only a room-data cleanup. Apply must realign the authored contract, validation checks, and runtime wall or pass-through behavior around side-wall openings. The scope stays bounded to the current four gravity rooms and the existing one-field, one-button, one-room-shell model.

## Goals / Non-Goals

**Goals:**
- Move the active enclosed gravity-room contract from bottom-edge openings to side-wall openings.
- Preserve the enclosed shell, one linked gravity field, one interior disable button, and reset behavior for every current gravity room.
- Remove bottom doors and doorway-only bottom helper geometry from the current rollout while reusing existing intended route supports.
- Reject false positives where a room still retains bottom-edge doors or bottom pass-through even if left-versus-right heuristics appear correct.
- Keep runtime containment and pass-through behavior aligned with authored side-wall openings only.

**Non-Goals:**
- Introduce new room-state logic, extra buttons, multiple linked fields, or new door interaction mechanics.
- Add new helper platforms, top-entry variants, or generalized arbitrary wall-opening authoring beyond the current entry and exit pair.
- Redesign unrelated gravity-room interior challenge beats beyond what is necessary to preserve route readability after door relocation.

## Decisions

### 1. Side-wall openings become the authoritative room contract
Apply should update the current enclosed gravity-room model so rooms use one side-wall entry opening and one separate side-wall exit opening, not bottom-edge openings. For the current rollout, `IN` remains left-wall entry and `OUT` remains right-wall exit.

Alternative considered: keep the current bottom-door data model and rely on player-facing left or right read metrics. Rejected because it still allows bottom-edge false positives and does not fix runtime wall logic that assumes floor cutouts.

### 2. Runtime wall segmentation should be generalized from bottom spans to edge-aware shell cutouts
The current builder and runtime helpers derive sealed shell bands from bottom-door spans. Apply should instead derive blocking shell segments from the shell rectangle plus the authored entry and exit door rectangles, so pass-through is allowed only at the side-wall openings and every other shell edge, including the full bottom edge, remains sealed.

Alternative considered: patch only validation and leave runtime bottom-span helpers intact. Rejected because the user explicitly requires runtime wall and pass-through behavior to match the new side-wall contract.

### 3. Doorway support must reuse existing side-adjacent route supports, including existing moving supports when they are already the route
Current gravity rooms must not gain new helper platforms, helper ledges, or bottom route strips for compliance. Door relocation should reuse existing intended route-support geometry on the approach or reconnect side of each room. If the intended path already uses a moving platform outside the room, that moving platform may remain the doorway support. The forest pre-room moving platform at `8610,450` is the explicit example and should be treated as a valid design constraint for apply, not as an exception to be designed away.

Alternative considered: force all doorway support to be static. Rejected because the current route language already permits moving support when it is part of the intended traversal and explore explicitly called that out.

### 4. Validation must reject bottom-edge remnants and above-room surrogate supports even when left-right heuristics pass
Apply should not trust ratio-based or route-summary checks alone. Validation should fail if a current room still places an entry or exit on the bottom edge, keeps a doorway-only bottom helper strip, or reaches a side door only by an above-room surrogate support path rather than a side-adjacent support. This prevents technically traversable but contract-breaking layouts from passing.

Alternative considered: rely on focused playtests to catch the remaining wrong reads. Rejected because this defect class is deterministic and belongs in authored validation.

### 5. Presentation stays local and rectangular, but it must no longer imply floor cutouts
The shell, door, and button presentation grammar can stay in the existing retro rectangle language. Apply only needs to update rendering code if it assumes bottom openings when drawing shell bands or door markers. If the renderer already respects door rectangles generically, stage data and runtime changes should be sufficient.

Alternative considered: defer presentation-spec updates and treat this as a purely mechanical change. Rejected because the current presentation spec explicitly names bottom door openings and would become inconsistent with the new contract.

## Risks / Trade-offs

- Side-wall runtime containment may touch both builder helpers and `GameSession` collision segmentation -> Keep apply focused on gravity-room helpers and targeted simulation coverage rather than broad collision refactors.
- Reusing existing supports can still produce awkward door placement if route rectangles are left stale -> Update door rectangles, support metadata, and route rectangles together for each affected room.
- Forest and sky rooms may validate while still feeling awkward at speed if moving or side-adjacent supports are only barely aligned -> Keep focused playtests in scope and treat traversal readability failures as blockers.
- Presentation code may quietly assume bottom openings even if specs and data no longer do -> Include a view-level check during apply if gravity-room shell rendering uses edge-specific logic.

## Migration Plan

1. Update the gravity-room requirement deltas so platform, progression, and presentation contracts all describe side-wall openings.
2. Refactor gravity-room helper logic and runtime containment to derive blocked shell segments from side-wall door cutouts rather than bottom-door spans.
3. Re-author the four current gravity rooms to remove bottom doors and bottom helper geometry while relocating entry and exit flow onto existing side-adjacent supports.
4. Run focused stage validation tests, simulation tests, and the gravity-room in-out playtest to confirm the rollout stays traversable and rejects bottom-door false positives.

## Open Questions

None. The change is apply-ready with the current room model, the known four-room rollout, and the explicit moving-platform support example at `8610,450`.