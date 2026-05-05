## Context

Checkpoint contracts already require safe and stable footing, but current authoring and respawn behavior still leave a gap between stated intent and enforceable rules. The repo does not currently prove that many authored survey beacons are floating, yet the existing validation path does not directly guarantee visible grounded support, and checkpoint recovery still derives too directly from checkpoint rectangles to make unsupported placements impossible.

This change spans stage content validation, checkpoint placement semantics, and respawn recovery semantics. It also carries explicit product constraints from explore: apply must forbid false-positive fixes such as invisible helper support, trigger-box hacks, respawn-only Y offsets, or isolated one-off nudges that avoid adding reusable guardrails.

## Goals / Non-Goals

**Goals:**
- Make survey-beacon placement depend on visible, stable, reusable support that belongs to the intended authored route.
- Align checkpoint respawn semantics with that same support contract so recovery starts from grounded authored footing instead of an unchecked checkpoint rectangle.
- Add reusable validation, focused tests, and authored audit steps that catch unsupported checkpoints before runtime use.
- Fix only the checkpoint placements that actually fail the new rule after audit rather than assuming broad content churn.

**Non-Goals:**
- Reworking general player spawn logic unrelated to checkpoint recovery.
- Hiding unsupported checkpoints with runtime-only Y corrections, expanded activation boxes, or invisible helper geometry.
- Performing speculative stage cleanups for checkpoints that already satisfy the grounded-support rule.

## Decisions

### Decision: Define checkpoint grounding from visible authored support, not from beacon rectangles alone
Checkpoint acceptance should require a readable support surface directly under the survey beacon footprint that also belongs to traversable authored route geometry. The same support must be visible and stable in normal play so the beacon reads as grounded to the player.

Alternative considered: keep using the checkpoint rectangle as the primary source of truth and add limited runtime snapping. Rejected because that still permits floating beacon authoring and makes support failures depend on hidden runtime correction.

### Decision: Make respawn recovery derive from grounded support contract rather than respawn-only offset fixes
Checkpoint restore should resolve from the validated grounded checkpoint anchor and its local support relationship, not from an unsupported beacon rectangle plus a special-case vertical correction. This keeps checkpoint activation, authored layout, and respawn behavior on one contract.

Alternative considered: allow unsupported checkpoints so long as respawn applies a Y fix or nearby landing probe. Rejected because that masks bad authoring and breaks the requirement that the checkpoint itself be visibly grounded.

### Decision: Reject fake support and narrow content-only hacks explicitly
Validation and spec language should explicitly disallow invisible helper platforms, oversized or shifted trigger regions that make an airborne beacon appear acceptable, temporary respawn-only support, and one-off beacon nudges without reusable validation criteria. Stable support must come from visible authored footing that remains valid across fresh attempts and checkpoint respawns.

Alternative considered: leave these fixes implicit under a general "safe placement" rule. Rejected because recent explore found that implicit wording still leaves room for false-positive fixes during apply.

### Decision: Pair stricter validation with authored checkpoint audit and focused regression coverage
Apply should add direct validation checks, targeted tests, and an authored audit pass over existing checkpoints. The audit should fix only failing placements and record that currently valid grounded checkpoints stay untouched.

Alternative considered: strengthen specs first and defer audit until later playtesting. Rejected because unsupported checkpoints could remain in authored data and undermine the new contract immediately.

## Risks / Trade-offs

- [Stricter grounding checks may fail existing stage content] -> Run a full authored checkpoint audit during apply and update only the beacons that fail the reusable rule.
- [Visible-support rules may be interpreted too narrowly and reject legitimate grounded layouts] -> Define support in terms of readable traversable route footing and cover accepted shapes with focused validator tests.
- [Respawn and authoring contracts may drift again if they are validated separately] -> Use one shared grounded-support rule for checkpoint placement and recovery tests.

## Migration Plan

No save or schema migration is required. Apply should land spec-aligned validation, respawn grounding updates, focused tests, and any failing checkpoint content fixes together so authored data and runtime semantics remain consistent. Rollback is a direct revert of the validation, recovery, and affected content changes.

## Open Questions

No open product questions remain for proposal. Apply should treat the current authored route-support surface as source of truth when choosing whether a checkpoint is grounded, and should leave already valid grounded checkpoints unchanged.