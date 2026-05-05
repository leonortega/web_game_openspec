## Context

The current repository already enforces shared metrics between the stage-start cabin and the exit capsule, and the live start sequence already preserves the grounded fixed-cabin anchor, rematerialization beat, scripted walk-out, and inert closed final state. The remaining gap is render ownership: `BootScene` creates a dedicated `exit` sprite texture, while `GameScene` still draws the start cabin from separate rectangle primitives.

This change is a narrow follow-up. It must make the start cabin use the same authored exit-capsule art path without reopening intro timing, checkpoint bypass, walk-out timing, or broader transition/audio behavior.

## Goals / Non-Goals

**Goals:**
- Make the exit-capsule art path authoritative for both the stage-completion endpoint and the fresh stage-start cabin.
- Preserve the current grounded start-cabin sequence semantics: reversed arrival effect, control lock, scripted walk-out, door close, and inert prop handoff.
- Add regression coverage that proves exact art reuse did not change fresh-start, auto-advance, or checkpoint-respawn behavior.

**Non-Goals:**
- Changing sequence durations, gameplay timing, checkpoint semantics, restart semantics, or audio cues.
- Reworking exit-finish behavior beyond helper reuse or shared presentation plumbing needed for parity.
- Adding new authored stage data or new per-stage presentation knobs.

## Decisions

### Use shared authored exit art instead of keeping separate start-cabin primitives
Apply should make the start cabin render through the same authored shell-and-door art path used by the exit capsule, with `BootScene` remaining the owner of the underlying texture and `GameScene` consuming that shared asset or a shared helper derived from it. Shared metrics alone are no longer sufficient because the request is for exact visual reuse, not approximate alignment.

Alternative considered: keep the current rectangle-based start cabin and only tune its colors or proportions. Rejected because that preserves the current drift risk and does not satisfy exact art parity.

### Preserve current start-sequence state machine and swap presentation layer only
The existing stage-start sequence state in `capsulePresentation` already defines the required rematerialize, walkout, closing, and inert phases. Apply should keep those phases and their timings intact, then replace only the start-cabin render path so the same behavioral contract continues under the shared art.

Alternative considered: rebuild the full arrival sequence around a new scene object hierarchy. Rejected because the user requested a tight visual follow-up, not another behavior rewrite.

### Prove parity through focused behavior and presentation checks
Validation should cover both sides of the change: unit coverage or scene-level assertions that the start cabin now consumes the exit-art path, and scripted playtests that confirm menu start, replay, and auto-advance still run the same bounded sequence while checkpoint respawns still skip it. Exit playtest coverage should remain in scope to catch regressions caused by shared presentation reuse.

Alternative considered: rely only on manual visual inspection. Rejected because this change explicitly targets exact parity and regression safety across two related presentation paths.

## Risks / Trade-offs

- [Shared art reuse could regress exit rendering while fixing the start cabin] -> Keep exit texture ownership stable and add coverage for both arrival and completion paths.
- [Start-sequence visuals could pick up exit-only disappearance semantics] -> Limit reuse to static art treatment and preserve current start-only arrival effect state handling.
- [Focused parity checks could overfit to implementation details] -> Assert shared art ownership at a stable helper or texture-key boundary and keep end-to-end playtests behavior-oriented.

## Migration Plan

No content migration is required. Apply can ship as a runtime presentation refactor on the existing stage-start path. Rollback is a straightforward revert of the shared art reuse if either the arrival path or exit path regresses.

## Open Questions

None.