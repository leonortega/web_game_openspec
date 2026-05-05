## Context

The repository already supports a bounded stage-start capsule arrival and a separate stage-exit capsule finish. The current start beat is close in structure, but it still leaves room for drift between the start capsule and the authored exit capsule, and it resolves directly into gameplay once the player appears instead of explicitly showing the astronaut stepping out.

This change is a narrow follow-up to that earlier stage-start work. It must keep the current scene order, checkpoint exclusions, and bounded intro timing intact while tightening the in-world handoff so the player sees the same capsule design, the same effect family in reverse, a short deterministic walk-out, and then a resolved closed inert prop before control starts.

## Goals / Non-Goals

**Goals:**
- Reuse the stage-exit capsule presentation as the authored start capsule design instead of maintaining a looser start-only variant.
- Define a deterministic fresh-start sequence of reversed rematerialization, scripted walk-out, and capsule close before active control begins.
- Preserve current menu-to-intro-to-game ordering, next-stage auto-advance behavior, and checkpoint respawn exclusions.
- Keep the start capsule distinct from a usable exit through state, timing, and behavior rather than through separate art.

**Non-Goals:**
- Changing checkpoint respawn semantics, restart rules, or objective persistence.
- Adding new audio cues or broadening this change into transition-audio ownership.
- Reworking stage-exit completion logic beyond any helper reuse needed to mirror its presentation.
- Introducing authored per-stage scripting knobs for the walk-out; the beat should remain bounded and deterministic across fresh starts.

## Decisions

### Reuse shared capsule presentation primitives instead of maintaining parallel start and exit designs
Apply should route the start capsule through the same shell, door, and footprint presentation path used by the stage-completion exit capsule, preferably by expanding shared helpers in `capsulePresentation` rather than duplicating values in separate scene branches. The start sequence can then layer start-only state transitions on top of the common capsule asset and layout contract.

This keeps the user-facing request literal: the beginning cabin uses the same design as the end-stage cabin. It also reduces long-term drift between the two authored devices.

Alternative considered: keep a start-specific capsule look that only approximates the exit. This was rejected because the user request is specifically about exact design reuse and because visual near-matches tend to drift over time.

### Treat fresh-stage entry as a short local sequence with fixed phases
The fresh-start handoff should resolve through explicit local phases: arrival effect reversal, astronaut materialized inside or at the threshold, scripted short walk-out, capsule close, then active play. These phases should be scene-local presentation state tied to the existing fresh-start gate rather than a broader new session mode.

This keeps checkpoint respawns naturally out of scope and gives apply a precise bounded contract for sequencing without widening stage simulation semantics unnecessarily.

Alternative considered: skip explicit phases and approximate the walk-out with one composite tween. This was rejected because the proposal needs a stable, testable ordering of appearance, walk-out, and close.

### Keep the walk-out deterministic and pre-control
The astronaut should not be user-controlled during the walk-out. Apply should drive a short fixed locomotion beat from the capsule doorway onto authored stable ground, then only enable normal input after the capsule has closed. If minor neutral simulation stepping is needed to preserve grounded animation, it should remain deterministic and should not expose ordinary hazard, failure, or branching behavior before the sequence finishes.

This satisfies the user-requested bounded timing and prevents the start beat from becoming input-sensitive or vulnerable to spawn-adjacent hazards.

Alternative considered: let the player control the first few steps out of the capsule. This was rejected because it produces timing variance, complicates tests, and weakens the intended mirrored presentation beat.

### Preserve distinct exit ownership through behavior, not different art
Because the same capsule design is being reused at stage start, spec-level distinction must come from context and state: the start capsule only appears at fresh entry, uses a reversed appearance effect instead of disappearance, performs an automatic walk-out, resolves to an inert closed prop, and never accepts interaction. The exit capsule remains the only endpoint that owns valid-completion disappearance behavior.

Alternative considered: add additional start-only visual markers to force distinction. This was rejected because it would undercut the request for exact design reuse and broaden art scope without needing to.

## Risks / Trade-offs

- [Shared presentation reuse exposes hidden coupling between start and exit capsule rendering] -> Factor common helpers deliberately and keep start-only behavior in separate state handling so completion flow does not regress.
- [Scripted walk-out could fail on uneven spawn geometry] -> Require the beat to use authored stable ground near the existing spawn and validate with targeted stage-start playtests on representative stages.
- [Fresh-start timing grows enough to make intro pacing feel slow] -> Keep each phase short, deterministic, and automatically chained with no extra player confirmation.
- [Same art at start and finish could blur semantic distinction] -> Preserve difference through reversed effect direction, walk-out-only behavior at start, and inert closed final state after arrival.

## Migration Plan

No content migration is required. Apply can ship as a runtime presentation update behind the existing fresh-stage entry path. Rollback is a straightforward revert of shared capsule presentation reuse and the scripted walk-out sequence if regressions appear.

## Open Questions

None. The user request and explore handoff resolve the main ambiguity by preferring a scripted pre-control walk-out over player-controlled exit behavior.