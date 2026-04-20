## Context

Recent archived changes already established the core contracts for capsule-entry stage completion, gravity capsule distinctness, and removal of decorative astronaut accents from transition scenes. The remaining issues are narrower and sit at the seams between stage authoring, runtime finish presentation, and intro-scene art direction: exits are still authored as raw rectangles with no explicit support validation, the finish effect can lose hide-state ownership late in the handoff, and the stage intro still contains a right-side animated accent that can read as a player figure.

This is a cross-cutting but bounded change because it likely touches authored stage validation, finish-state consumption in the simulation-to-scene handoff, and transition-scene presentation. The goal is to close the remaining readability gaps without changing progression rules, objective gating, audio ownership, or the broader gravity capsule mechanic.

## Goals / Non-Goals

**Goals:**
- Reject unsupported or floating exit placements during authored stage validation.
- Keep the player fully hidden and non-interactive for the rest of the exit-finish sequence once the dematerialization has resolved.
- Restyle or replace the stage intro accent so it reads as abstract transition dressing rather than a decorative astronaut or player-figure pose.
- Preserve existing stage ordering, exit eligibility, stage-clear handoff timing, and transition flow semantics.

**Non-Goals:**
- Redesigning the full exit prop, stage-clear scene, or gravity capsule system.
- Changing lightweight objective rules, checkpoint behavior, or stage completion unlock semantics.
- Introducing new audio cues, new transition timing, or new stage-presentation fiction.
- Broadening stage authoring validation into a generalized support-analysis framework for all objects.

## Decisions

### Add exit-specific support validation in authored stage checks
Stage data should keep using the existing exit rectangle representation, but authored validation should add a narrow exit rule that requires readable support or footing directly beneath the exit endpoint on the intended route. This keeps the data model stable while catching the current class of floating exits before runtime.

Alternative considered: convert exits into a richer authored object type with explicit base geometry metadata. This was rejected because the current issue is validation, not expressiveness, and a new data shape would broaden the change beyond what the user asked for.

### Treat finish-visibility suppression as explicit exit-finish ownership rather than an incidental scene effect
The implementation should rely on the existing finish-state timing plus one authoritative indicator for whether ordinary player-part rendering is still allowed. Once the finish sequence reaches the disappearance point, normal multipart player visibility must stay suppressed until the completion handoff resolves, instead of being reasserted by the ordinary per-frame presentation path.

Alternative considered: tune the existing visual-progress threshold only. This was rejected because the bug summary indicates a state-ownership problem rather than a simple timing constant mismatch, so threshold tuning alone risks leaving the same reappearance path in place.

### Replace the intro-side accent with a non-figurative stage-facing motif
The stage intro should keep bounded accent motion, but the right-side treatment should resolve into abstract stage-facing graphics such as signal bars, beacon sweeps, route frames, or other non-character motifs. The design constraint is perceptual: even a stylized accent must not read like a helmeted astronaut or player idle pose.

Alternative considered: remove the accent entirely. This was rejected because the spec still allows sparse accent motion, and keeping a non-figurative accent preserves visual balance without violating the transition contract.

## Risks / Trade-offs

- Exit validation may fail existing authored stages that currently rely on visually unsupported placement. → Mitigation: keep the rule narrow and update only the specific authored exits that no longer satisfy the contract.
- Finish cleanup may touch both simulation and scene presentation boundaries. → Mitigation: keep one authoritative finish-visibility rule and cover it with focused simulation or stage-flow regression tests.
- A new intro accent could still accidentally read as character-like. → Mitigation: choose obviously abstract shapes and verify with the existing stage intro playtest surface rather than only code review.

## Migration Plan

No data migration is required. Apply should update authored stage data only where exit validation now rejects unsupported placement, then land the finish cleanup and intro-scene presentation adjustment together so validation and presentation stay aligned. Rollback is a straightforward revert of the validation rule, finish-visibility ownership changes, and intro accent art logic if regressions appear.

## Open Questions

None. The remaining ambiguity from explore is implementation-level rather than proposal-level, and the bounded decisions above are sufficient to proceed to apply.