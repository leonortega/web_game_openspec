## Context

The prior gravity-room follow-up established side-aware door semantics and left the bounded-room model intact, but implementation solved some failures by adding extra support platforms near door openings. This change is narrower than another validation rewrite: the current playable gravity rooms already have usable route-support geometry, so apply should move door openings and any dependent route rectangles onto those existing supports instead of expanding room layouts with dedicated doorway helpers.

Forest, amber, and both sky rooms remain in scope, with the sky anti-grav and sky inversion rooms likely needing the most careful coordination because their current route rectangles, moving support timing, and room shell openings are more tightly packed. Existing validation already understands fixed and moving-platform support, so the design focus is on preserving that flexibility while making the rollout constraint explicit and updating stage data accordingly.

## Goals / Non-Goals

**Goals:**
- Make the current gravity-room rollout explicitly prefer door relocation over new helper-platform additions.
- Keep left-side entry and right-side exit semantics for the affected rooms while reusing existing reachable route supports.
- Ensure validation and tests still accept fixed or moving-platform doorway support when that support is already part of the authored route.
- Call out coordinated route-rectangle and room-opening updates needed to keep the intended traversal readable after door moves.

**Non-Goals:**
- Redesign gravity-room runtime behavior, shell blocking, or disable-button interaction.
- Introduce new support-platform types, new shell geometry primitives, or new door interaction mechanics.
- Expand scope into a general cleanup of unrelated gravity-room aesthetics or route structure beyond the current affected rooms.

## Decisions

### 1. Treat this as a rollout-authoring constraint, not a new room-system feature
The new requirement should target the current playable enclosed gravity rooms and describe how those rooms are authored: doors move to existing supports, rather than adding doorway-only helper platforms. This keeps scope aligned with the user request and avoids over-generalizing a narrow follow-up into new runtime mechanics.

Alternative considered: express this only as an implementation note in tasks. Rejected because the request changes expected authored behavior for the current rollout and needs spec coverage.

### 2. Reuse existing route-support geometry, whether fixed or moving
Apply should preserve the current validation model that allows a doorway to be supported by a fixed platform or a moving platform. The constraint is not "fixed only"; it is "already part of the authored route." If a moving platform already serves the route beat cleanly, door relocation may target that support instead of adding a new static helper.

Alternative considered: forbid moving-platform doorway support to simplify the rollout. Rejected because existing specs explicitly allow moving supports and explore noted they remain feasible in this follow-up.

### 3. Update route rectangles together with door relocation
Door repositioning alone is insufficient if route rectangles, room-opening bounds, or local approach/reconnect assumptions still point at the old opening positions. Apply should treat each affected room as a small coordinated authoring update: move door openings, adjust any dependent route segments, and preserve disable-button reachability and shell containment.

Alternative considered: limit updates to door coordinates only. Rejected because misaligned route rectangles would leave validation or traversal logic pointing at stale geometry.

### 4. Limit room edits to the known current rollout unless validation exposes a directly related miss
The default apply scope is the current gravity rooms called out by explore: forest, amber, sky anti-grav, and sky inversion. If focused validation reveals another current gravity room still relying on doorway-only helper support, that room is in scope as the same defect class; otherwise, avoid widening the pass.

Alternative considered: re-audit and re-author every stage room regardless of findings. Rejected because it adds churn without evidence of additional failures.

## Risks / Trade-offs

- Tight doorway relocations in sky rooms may break approach or reconnect readability. -> Re-author door positions with route-rectangle updates as one change and verify with targeted traversal coverage.
- Existing supports may technically validate but feel awkward at gameplay speed. -> Keep playtest verification focused on clean approach, landing, and room exit flow, not only schema acceptance.
- Distinguishing reused route support from dedicated helper additions may be partly authoring-convention based. -> Phrase the spec around current rollout expectations and back it with room-specific tests or fixture coverage.

## Migration Plan

1. Update proposal-linked spec deltas for `platform-variation` and `stage-progression`.
2. Re-author the affected current gravity rooms by relocating doors onto existing route supports and updating dependent route rectangles.
3. Run focused validation and playtests for the affected rooms.
4. If another current gravity room fails for the same helper-platform pattern, include it in the same apply pass; otherwise stop at the known set.

## Open Questions

None. The change can proceed with the current room model, current support geometry, and existing fixed-or-moving doorway support rules.