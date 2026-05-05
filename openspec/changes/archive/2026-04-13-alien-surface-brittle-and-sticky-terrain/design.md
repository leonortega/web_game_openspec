## Context

This change crosses stage authoring, simulation state, controller behavior, Phaser rendering, and verification coverage. The repo already distinguishes between durable traversal discovery such as reveal platforms and live timing state such as temporary bridges, and it already treats low gravity as a modifier that changes the airborne arc after an impulse rather than replacing the impulse itself. Brittle crystal floors and sticky sludge surfaces need the same kind of bounded rules: authored metadata must stay simple, runtime behavior must remain readable and fair, and verification must prove the renderer and simulation stay aligned.

## Goals / Non-Goals

**Goals:**
- Add exactly two new authored terrain surface kinds: brittle crystal floors and sticky sludge.
- Define brittle crystal timing, warning, support, and reset behavior precisely enough that apply can implement it without further product decisions.
- Define sticky sludge movement effects and its interaction with buffered jumps, coyote time, springs, dash, and low-gravity zones while preserving the current controller model.
- Require bounded stage-data validation, stage fixture updates, and playtest coverage for the new surfaces.
- Reuse existing stage/runtime/rendering pathways instead of introducing a broader material-physics system.

**Non-Goals:**
- Add gravity inversion, magnetic adhesion, wall-cling, directional gravity, or a generalized material-physics abstraction.
- Redesign the base controller, change power semantics, or add new HUD and narrative surfaces.
- Perform unrelated stage-layout or turret cleanup outside the new surface fixtures needed for coverage.

## Decisions

- Represent both surfaces as explicit authored terrain-surface metadata attached to existing stage geometry instead of introducing a new freeform physics layer.
  - Rationale: the likely touchpoints already include stage data, session simulation, and scene rendering. A small surface-kind extension keeps the change local to current authoring and render/sim sync paths.
  - Alternative considered: add a generalized material system with composable physics modifiers. Rejected because it broadens scope into a new abstraction the user explicitly excluded.
- Define brittle crystal floors as one-shot delayed-collapse top surfaces.
  - Resulting rule: the first time the player gains top-surface support on a brittle crystal floor, that floor starts a short warning countdown. During the warning window it remains fully solid and jumpable. When the countdown expires, the floor becomes broken and non-supporting. If the timer expires while the player still has top-surface contact, the floor stays valid support only until that support contact ends, then breaks immediately.
  - Rationale: this gives the player readable warning and preserves fair escape jumps without making the floor permanently safe.
  - Alternative considered: instant collapse on contact. Rejected because it is harder to read and undermines the requested fair support behavior.
- Reset broken brittle crystal floors on death, checkpoint respawn, manual restart, and fresh attempts rather than persisting breakage through checkpoint recovery.
  - Rationale: brittle collapse is live traversal timing state, not durable route discovery. Resetting it keeps retries readable, avoids snapshot complexity, and matches the repo's existing distinction between checkpoint-persistent discovery and non-persistent timed state.
  - Alternative considered: persist broken floors if the checkpoint was activated after collapse. Rejected because it would make recovery routes fragile and add checkpoint-state branching for a one-shot hazard.
- Limit sticky sludge to grounded movement penalties and grounded jump initiation, while preserving existing move semantics for buffered input and timing windows.
  - Resulting rule: while grounded on sticky sludge, the player uses reduced grounded acceleration, reduced grounded max speed, and a reduced jump launch impulse for ground or coyote jumps sourced from that sludge support. Jump buffering and coyote time still work normally; they simply consume the sludge-tuned jump if the buffered or coyote jump resolves from sludge support.
  - Rationale: the controller remains coherent because sludge changes only the support-dependent launch context, not the presence of the movement affordances themselves.
  - Alternative considered: reduce all movement, including air control and jump windows. Rejected because it would blur controller semantics and create many more edge cases.
- Keep spring launches and dash motion unchanged by sticky sludge, and compose sludge with low gravity by sequencing the modifiers.
  - Resulting rule: a spring launch keeps its normal launch impulse even when triggered from sludge. Dash keeps its normal dash motion while active. Low gravity still changes only the post-impulse airborne arc. A normal jump launched from sludge inside a low-gravity zone therefore starts from the reduced sludge jump impulse, then low gravity stretches the remaining arc afterward.
  - Rationale: this preserves the existing controller contract for springs, dash, and low gravity while still making sludge meaningful during standard grounded traversal.
  - Alternative considered: damp spring and dash impulses on sludge contact. Rejected because it would conflict with the existing impulse-first rule and make the interaction matrix harder to learn.
- Keep authored validation bounded to shape and support integrity, plus one practical sync expectation.
  - Resulting rule: validation should require supported surface kinds, positive bounded rectangular metadata, alignment to existing solid walkable support, and no malformed or contradictory surface annotations for the same footprint. Brittle floors must map to real supporting tiles so they can warn, support, and break predictably. Verification should include fixture coverage and a short playtest probe that demonstrates both a brittle-floor escape and a sticky-sludge traversal section while confirming rendering follows the same authored extents as simulation.
  - Rationale: this catches bad data early without introducing pathfinding-style route safety analysis.
  - Alternative considered: add full route-safety simulation for every surface annotation. Rejected because it is broader than necessary for this bounded change.

## Risks / Trade-offs

- [Risk] Surface metadata could drift between rendering and simulation if each layer interprets the bounds differently. → Mitigation: drive both layers from the same authored rectangles and cover the shared extents in fixtures and playtest output.
- [Risk] Sticky sludge tuning could make stages feel sluggish if the penalties are too aggressive. → Mitigation: keep the effect limited to grounded acceleration, grounded max speed, and grounded jump launch only.
- [Risk] Brittle-floor reset behavior may differ from player expectations if some traversal state persists and some does not. → Mitigation: keep the distinction explicit in specs: brittle floors reset like live timing state, not like durable discovered routes.
- [Risk] New validation may fail existing or planned stage layouts. → Mitigation: constrain the validator to data integrity and support mapping and update only the necessary stage fixtures during apply.