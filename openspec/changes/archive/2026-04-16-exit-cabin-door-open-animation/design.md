## Context

Recent changes already established the important behavior around the capsule family: the fresh stage-start cabin is fixed and grounded, the exit endpoint is grounded and validated, the start cabin reuses the exit art, and valid completion already uses a bounded teleport finish before the results surface. The remaining presentation gap is local to the exit endpoint itself. During stage completion, the player disappears through the finish sequence, but the exit cabin does not yet perform its own independent door-open motion, which weakens the readability of the player entering that device.

This is a small cross-cutting presentation change because the same capsule art path is shared between start and exit states. The implementation therefore needs one narrow design decision: add exit-only open-state presentation without regressing the grounded start cabin, without changing the start-sequence contract, and without shifting the existing results handoff semantics.

## Goals / Non-Goals

**Goals:**
- Add a short explicit door-open beat to the valid exit-finish sequence.
- Keep start and exit cabins grounded and visually consistent while ensuring only the exit owns the new door-open finish behavior.
- Preserve objective gating, finish timing bounds, teleport readability, and stage-clear handoff behavior.
- Define validation that confirms grounded start/exit behavior still holds after the presentation update.

**Non-Goals:**
- Changing start-cabin arrival, walk-out, or close timing.
- Adding new completion audio behavior or altering existing transition stingers.
- Reworking stage data, exit collision semantics, or checkpoint rules.
- Introducing alternate completion branches or longer finish timing.

## Decisions

### Add an exit-only open state to the shared capsule presentation path
The start and exit cabins already share art treatment, so the cleanest implementation is to extend the shared capsule presentation with an explicit exit-only door-open state or animation phase. The start cabin should keep its current arrival and close behavior, while the exit cabin gains a separate open beat that is available only during valid completion.

Alternative considered: create a second exit-only art path separate from the shared capsule presentation. This was rejected because it would duplicate recent shared-capsule work and raise regression risk for shape, grounding, and styling consistency.

### Trigger the door-open beat from the existing bounded exit-finish sequence instead of creating a new completion phase
The door animation should live inside the current finish window that already freezes control and resolves into the results handoff. That keeps completion timing centralized and avoids a second ad hoc timer path. The scene can expose the door-open moment visually while the existing finish sequencing remains authoritative for when gameplay ends and the stage-clear flow begins.

Alternative considered: add a separate pre-finish phase before the current teleport logic. This was rejected because it broadens scope and makes it easier for timing or trigger order to drift from the current completion contract.

### Validate with targeted presentation coverage rather than new systems
Apply should use focused regression coverage around the existing stage-start and exit-finish playtests, plus any small presentation tests needed for the shared capsule renderer. Validation should prove three things: the grounded start cabin still behaves as before, the grounded exit endpoint still behaves as before, and the exit door visibly opens during the finish window.

Alternative considered: broaden validation into unrelated transition or audio coverage. This was rejected because the request explicitly avoids unrelated scope.

## Risks / Trade-offs

- Shared capsule presentation changes could accidentally make the start cabin open when it should stay inert. → Mitigation: gate the new open state strictly to the exit-finish path and cover start-sequence regression in playtests.
- The new door-open beat could reduce teleport readability if it overlaps too much with the dematerialization effect. → Mitigation: keep the door motion short, local, and inside the existing bounded finish window.
- Scene-side timing could drift from the authoritative completion handoff if open-state timing is inferred separately. → Mitigation: derive the door-open presentation directly from existing finish-sequence state instead of adding a second completion flow.