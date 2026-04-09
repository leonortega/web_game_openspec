## Context

Turret-style enemies and hopping enemies are authored directly into stage layouts. Today, turrets are only clamped to a supported lane during snapshot creation, and hoppers jump on a timer without selecting a landing platform. That is enough for simple encounters, but it breaks down when a stage needs a turret relocated away from hazards or a hopper that should stay on a platform chain.

## Goals / Non-Goals

**Goals:**
- Keep turret placement readable by separating them from nearby hazards and grounded enemies.
- Make hopper enemies choose a safe landing platform instead of entering unsupported free fall.
- Apply the fix to current authored stages and keep the behavior safe for future stages.

**Non-Goals:**
- Adding a full enemy AI pathfinding system.
- Reworking combat balance across all enemy archetypes.
- Changing the player movement model.

## Decisions

- Use deterministic placement adjustment during stage setup for turret spacing conflicts.
  - Rationale: this fixes current and future authored layouts without requiring every stage to be manually perfect.
  - Alternative considered: manual edits only. Rejected because it would not prevent regressions in future stages.

- Add hopper target selection based on supported platform reachability rather than a fixed jump timer alone.
  - Rationale: the requirement is platform-to-platform jumping, not generic falling with a high impulse.
  - Alternative considered: just increasing jump force. Rejected because it still leaves the enemy dependent on overlap and can produce drops.

- Keep the hopper logic deterministic and stage-local.
  - Rationale: predictable encounter patterns are easier to author and verify than broader pathfinding.
  - Alternative considered: dynamic graph search across the whole world. Rejected because it is heavier than needed for the current stage structure.

## Risks / Trade-offs

- [Risk] A placement adjustment may shift turrets away from their original authored intent.
  - Mitigation: keep the relocation local and constrained to nearby supported positions.

- [Risk] Hopper retargeting may cause repeated oscillation if the candidate search is too permissive.
  - Mitigation: limit target selection to supported platforms that are clearly reachable and keep the choice deterministic.

- [Risk] Current stage layouts may need a small manual pass after the runtime fix.
  - Mitigation: update authored stage data where turret spacing is still too tight after validation.

## Migration Plan

1. Add the runtime spacing and hopper-routing helpers.
2. Update authored stage data where the current layouts still conflict.
3. Verify the affected stages with playtesting or the stage validation flow.
4. If the encounter feel regresses, narrow the adjustment rules before widening them.

## Open Questions

- Should turret relocation prefer lateral movement first, or should it also be allowed to move to a different supported platform in the same segment?
- Should hopper target selection favor the nearest reachable platform or the platform that best preserves the authored pacing lane?

