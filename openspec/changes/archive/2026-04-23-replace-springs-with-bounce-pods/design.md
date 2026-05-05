## Context

Spring platforms still exist as authored stage content even though bounce pods already define the green contact-launcher family that best fits current route language. Removing springs is cross-cutting because the authored replacements must preserve route geometry and footing while the implementation also deletes spring-specific type unions, validation branches, simulation logic, renderer or audio dispatch, scripted coverage, and spec wording.

## Goals / Non-Goals

**Goals:**
- Replace every authored spring beat with bounce-pod-assisted support geometry that preserves approach footing, landing reliability, and route readability.
- Remove spring as a supported authored and runtime traversal kind so no dead unions, renderer branches, validation rules, or audio cues remain.
- Re-express controller, launcher, and gravity-composition rules without spring-only wording while preserving current bounce-pod and gas-vent behavior.
- Retarget automated tests and scripted playtests so launcher coverage and stage verification prove the converted routes still work.

**Non-Goals:**
- Introduce new launcher families beyond existing `bouncePod` and `gasVent`.
- Retune bounce-pod or gas-vent behavior beyond what is required to match former spring route intent.
- Change unrelated traversal systems, gravity-room rules, HUD behavior, or menu presentation.
- Replace bounce pods with gas vents for the converted routes.

## Decisions

- Convert each authored spring into support-plus-launcher composition.
  - Decision: each current spring placement becomes a plain support platform plus a bounce-pod annotation or object aligned to that support surface, with any small support-geometry adjustment kept local to preserve the former route shape.
  - Rationale: bounce pods are not a 1:1 spring skin, so preserving route intent requires explicit footing and launch-contact alignment instead of a presentation-only swap.
  - Alternative considered: rename springs to bounce pods without changing geometry. Rejected because it risks broken contact timing, missing support, and dead spring semantics hiding behind new visuals.

- Remove spring from every source-of-truth traversal enum and dispatcher.
  - Decision: authored data, validation, builders, runtime state, simulation dispatch, rendering, audio selection, and tests will no longer accept or branch on a spring kind.
  - Rationale: partial removal would leave unreachable code, stale fixtures, and misleading spec or test coverage.
  - Alternative considered: keep legacy spring support behind a compatibility alias. Rejected because the request is explicit removal, not deprecation.

- Keep launcher behavior centered on bounce pods and gas vents only.
  - Decision: remaining movement-composition rules will describe launcher behavior in terms of bounce pods and gas vents or the launcher family, not springs, and the converted green launch surfaces will read as bounce pods.
  - Rationale: this keeps the spec contract aligned with the intended visual family and avoids preserving spring as a ghost mechanic in wording alone.
  - Alternative considered: keep spring terms in controller prose as a historical alias. Rejected because it undermines the removal and complicates future maintenance.

- Retarget validation and coverage around launcher-only fixtures and converted stage routes.
  - Decision: validation rejects lingering spring authoring, tests cover launcher metadata and route preservation, and scripted playtests verify the converted stage beats rather than old spring fixtures.
  - Rationale: deleting spring support safely requires proof that authored data, runtime behavior, and route readability still hold after conversion.
  - Alternative considered: remove spring tests without replacing them. Rejected because it would leave the cross-cutting migration unguarded.

## Risks / Trade-offs

- [Risk] Bounce pods may not match former spring launch timing one-for-one. -> Mitigation: require each converted route to preserve support footing and assisted-movement readability through local support-geometry adjustments, not visual replacement alone.
- [Risk] Spring removal may leave dead unions or unreachable dispatch branches in subsystems not obviously tied to stage authoring. -> Mitigation: make spring deletion an explicit whole-stack migration across types, builders, simulation, rendering, audio, validation, and tests.
- [Risk] Spec updates could miss scattered spring wording and leave conflicting contracts. -> Mitigation: modify every capability that still names spring behavior, stage overlap rules, or spring-specific audio references.
- [Risk] Playtest coverage could pass while converted routes still feel awkward. -> Mitigation: keep scripted coverage focused on the exact converted launcher beats and require preserved footing and route shape as part of implementation acceptance.