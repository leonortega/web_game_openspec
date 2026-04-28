## Context

The enemy contract already distinguishes grounded foot enemies from true flyers and already expects hoppers to move across supported route geometry rather than free-falling into gaps. The remaining bug is narrower: some authored or resolved hopper spawns still read as unsupported, and hopper startup logic can commit to a leftward first hop before evaluating which supported landing the current layout actually expects.

This change should stay bounded to grounded hopper grounding and initial route choice. It is not a flyer-system rewrite, not a generic enemy pathfinding project, and not a rework of overall encounter balance.

## Goals / Non-Goals

**Goals:**
- Keep grounded walkers and hoppers visually and physically anchored to real support at spawn and during supported waiting states.
- Make a hopper's first committed hop choose a reachable supported landing that matches the authored encounter lane instead of defaulting left.
- Reject authored hopper setups that have no valid support or no reachable initial landing for the intended encounter.
- Preserve current hover behavior and presentation for true flyer enemies.

**Non-Goals:**
- Rewriting the full hopper system into general-purpose pathfinding.
- Changing flyer movement, hover presentation, or camera-lane behavior.
- Rebalancing every enemy archetype or retuning unrelated encounter timing.

## Decisions

### Decision: Treat grounded hopper startup as support-derived, not free-space-derived
Grounded hopper startup should resolve from actual support geometry first. If the authored spawn does not map to valid support, validation should fail and runtime should use only a narrow defensive fallback instead of letting the hopper present as floating.

Alternative considered: rely on runtime snapping alone. Rejected because it can hide bad authoring and still leave the first visible frame looking wrong.

### Decision: Select the first hop from reachable supported candidates before applying default horizontal bias
Initial hopper routing should evaluate reachable supported landing candidates for the current layout, then choose the deterministic candidate that best preserves the authored lane. Only after that candidate set is empty should the hopper wait or fall back to a bounded support-preserving idle state.

Alternative considered: keep the current timer and horizontal default, then correct after launch. Rejected because the visible bug is the first committed hop itself.

### Decision: Keep invalid hopper authoring a validation failure, not a runtime feature
Unsupported hopper spawns and layouts whose first intended hop has no reachable supported landing should fail stage validation and focused tests. Runtime behavior should remain defensive for stale or legacy data, but apply should not depend on permissive runtime cleanup as the main contract.

Alternative considered: allow runtime to pick any emergency landing or convert the hopper into a hover-like wait state. Rejected because that muddies the grounded-versus-flyer distinction and weakens authoring guarantees.

### Decision: Preserve explicit separation between grounded hoppers and flyers
Any new startup or waiting behavior for grounded hoppers must stay within grounded-foot-enemy semantics and presentation. True flyers must continue using hover-only behavior and hover-only visual language.

Alternative considered: share more fallback movement logic between hoppers and flyers. Rejected because the handoff explicitly forbids broadening this bug fix into a flyer rewrite.

## Risks / Trade-offs

- [Stricter validation may fail existing stage data that currently passes] -> Keep the rule specific to unsupported grounded hopper starts and unreachable initial landing setups, then update only the affected authored encounters.
- [Deterministic candidate choice may still pick the wrong lane on ambiguous symmetric layouts] -> Prefer authored support continuity and add focused tests for the current failing encounter shapes.
- [Runtime defensive grounding could still mask defects during manual play] -> Pair any defensive runtime correction with validator failures and regression coverage so bad authoring remains visible to apply.

## Migration Plan

No schema or save migration is required. Apply should land stage-validation tightening, hopper startup-routing changes, and any necessary authored stage corrections together so runtime behavior and content expectations stay aligned. Rollback is a straightforward revert of the validation changes, hopper startup selection logic, and affected authored-stage adjustments.

## Open Questions

No open product questions remain for proposal. Apply should use the existing authored support lane as the tie-breaker when multiple reachable first-hop candidates are otherwise equivalent.