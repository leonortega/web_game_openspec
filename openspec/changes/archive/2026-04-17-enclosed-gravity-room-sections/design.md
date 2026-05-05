## Context

Repo already supports bounded traversal mechanics through authored rectangles plus small retry-local state, but current gravity capsule behavior assumes one nearby button that enables a dormant field and does not model an enclosed room with separate entry and exit door openings. User handoff narrows desired direction: enclosed room, active field on room entry, one interior button that disables gravity, bottom entry and exit doors, and validation that all room content stays fully inside section bounds and remains reachable.

This change touches stage authoring, authored validation, runtime state, controller gating, scene presentation, and playtest coverage. Scope must stay narrower than a general room-state or puzzle framework.

## Goals / Non-Goals

**Goals:**
- Author enclosed gravity room sections as bounded room shells with one linked gravity field, one bottom entry opening, one separate bottom exit opening, and one interior disable button.
- Start each room with gravity active and latch the room field off on first eligible disable-button contact until reset.
- Keep gravity-room effects limited to player airborne vertical acceleration and preserve current jump, launcher, dash, and grounded controller semantics.
- Add validation that room shell fully contains linked field and all authored room-local content and that intended room routing stays reachable and not cut off.
- Keep room visuals readable in active and disabled states and clearly distinct from stage exits.

**Non-Goals:**
- New interact input, HUD prompt, hold-to-disable behavior, timed re-enable, or multi-button chaining.
- Arbitrary room-state logic, movable doors, lock-and-key systems, or generalized puzzle-room composition.
- Non-rectangular gravity simulation, enemy gravity changes, grounded inversion, ceiling walking, or vector gravity.
- New completion semantics or reuse of exit-finish teleport feedback for traversal rooms.

## Decisions

### Model current gravity capsules as enclosed gravity-room authoring, not as a new generalized room framework
Apply should extend existing gravity section authoring with explicit room-shell metadata, separate bottom entry and exit openings, and one interior disable-button linkage instead of introducing a new generalized room system. This keeps data and validation changes close to existing gravity-field and traversal-section structures.

Alternative considered: create a generic authored room framework shared by future mechanics. Rejected because request only needs one bounded gravity-room pattern and broader room-state abstractions would expand scope without immediate value.

### Use active-by-default, disable-latched runtime state
Each enclosed gravity room should initialize with its linked field active on fresh attempt, checkpoint respawn, death retry, and manual restart. First eligible contact with the interior button disables that room field on the same simulation update and leaves it disabled until next reset event. Runtime state should track this in simulation, with scene presentation reading from that authoritative state.

Alternative considered: make button toggle gravity on each contact. Rejected because handoff explicitly prefers disable semantics and a toggle would create avoidable state ambiguity.

### Require bottom entry and bottom exit as separate authored openings, while keeping door state presentation mostly decorative
Spec contract should require distinct bottom entry and bottom exit openings so stage authors can route approach and departure cleanly through one enclosed shell. Implementation can keep doors as authored geometry or local presentation cues rather than adding door-open or door-close gameplay state unless needed for readability.

Alternative considered: make the room use one shared opening or runtime-operated doors. Rejected because request explicitly calls for two bottom doors and does not require dynamic door simulation.

### Validate containment and reachability at authored-data layer
Validation should assert that linked gravity field bounds, platforms, enemies, hazards, pickups, and other room-local content stay inside room shell bounds and that the intended path inside the room is not cut off or unreachable. Validation should also require that the active-state room still lets the player reach the interior disable button from the entry side and that the overall stage stays safely completable after reset when the room returns active.

Alternative considered: rely only on manual playtest for room containment. Rejected because cropped or unreachable room content is predictable authored-data failure and should fail before runtime use.

### Keep presentation distinct from stage exits through state cues and room framing
Traversal gravity rooms should read as infrastructure, not completion endpoints. Active state should visibly communicate active field pressure, disabled state should visibly communicate safe or neutralized traversal, and entry and exit openings plus interior disable button should remain readable without HUD text. Distinction should come from room framing and state cues, not from exit-finish effects.

Alternative considered: reuse exit capsule presentation closely to save art effort. Rejected because players already associate exit capsules with completion and confusion risk is high.

## Risks / Trade-offs

- [Authoring complexity] More room metadata can make stage files easier to mis-author. -> Mitigation: keep one bounded room pattern and enforce it through validation and test fixtures.
- [Routing risk] Interior disable button could be reachable only in theory, not in a readable play path. -> Mitigation: require validation and scripted coverage to prove entry-to-button and button-to-exit traversal.
- [Presentation risk] Dual bottom doors and active field cues may still read like a stage exit if silhouettes drift too close. -> Mitigation: keep traversal-room framing and state cues distinct from exit-only presentation and finish effects.
- [Reset risk] Active-on-reset rooms can soft-lock progress if authors depend on prior disable state. -> Mitigation: require stages to remain completable from active baseline with reachable button access on every retry.

## Migration Plan

No migration blocker expected. Apply should extend stage schemas and validation first, then wire runtime state and scene presentation, then update authored stages and scripted coverage. Rollback is a straight revert of new room metadata, disable-state plumbing, and room-specific validation.

## Open Questions

No apply blocker. Exact art treatment for room shell, door openings, and disable button can be decided during implementation as long as active versus disabled state and traversal-versus-exit distinction remain clear.