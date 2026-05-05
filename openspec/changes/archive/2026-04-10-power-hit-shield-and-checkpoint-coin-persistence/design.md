## Context

The current gameplay flow resolves powered damage and checkpoint respawns in ways that conflict with the intended progression rules. A damaging hit currently removes health and clears active powers in the same event, so powers do not function as protective state. Separately, checkpoint respawn rebuilds the stage snapshot and resets collectible bookkeeping such as collected coin state and stage-start coin totals, which causes finite stage coins to reappear and makes duplicate coin rewards possible within one stage run.

This change crosses player damage handling, respawn restoration, collectible state tracking, and player-facing gameplay messaging. The design needs to make the damage rule and checkpoint rule explicit so implementation can update the right state boundaries without accidentally carrying collectible progress into fresh attempts.

## Goals / Non-Goals

**Goals:**
- Make any active power behave as a one-hit shield that is fully consumed on a damaging hit.
- Preserve the existing health-loss rule for damaging hits taken with no active power.
- Preserve collected coin identities, current coin totals, and any full-clear reward gating across checkpoint respawns within the same stage run.
- Reset coin collection normally on manual restart, new stage entry, or any other fresh attempt.
- Prevent duplicate coin increments or repeated full-clear rewards after respawning from a checkpoint.
- Update player-facing gameplay messaging where the old damage or checkpoint rule text becomes inaccurate.

**Non-Goals:**
- Introduce multi-hit shielding, partial power loss, or per-power durability.
- Persist collectible progress across separate stage runs, manual restarts, or stage transitions.
- Change how powers are earned, how checkpoints are activated, or how non-coin collectibles behave unless required by shared implementation.

## Decisions

- Resolve powered hits before health reduction and treat any non-empty active-power set as protected state.
  - Rationale: the requested rule is binary and easier to reason about if damage resolution first checks for active powers, consumes them, and skips heart loss for that hit.
  - Alternative considered: apply damage first and then restore health if powers were active. Rejected because it creates more edge cases for death, damage feedback, and HUD updates.
- Consume all active powers on the first protected hit rather than peeling off one power at a time.
  - Rationale: the proposal explicitly treats any active power as a one-hit shield and calls for all active powers to be removed by the hit.
  - Alternative considered: remove only one power or prioritize a specific power. Rejected because it adds ordering rules the change request does not want.
- Persist checkpoint coin progress as stage-run collectible state rather than rebuilding collectible availability from the original stage snapshot on respawn.
  - Rationale: coins are a finite authored set for the active stage run, so respawn should restore the player to the checkpoint while preserving which coin identities have already been consumed.
  - Alternative considered: rebuild the stage and then subtract previously earned coin totals. Rejected because it would still allow duplicate pickups and would desynchronize visible coin presence from the stored total.
- Gate coin awards and full-clear rewards on coin identity, not only on aggregate totals.
  - Rationale: if respawned gameplay sees the same collected coin again, identity-based gating prevents duplicate total increments and repeat full-clear payouts.
  - Alternative considered: clamp totals after respawn without tracking which coin was already taken. Rejected because it does not guarantee correct world-state restoration.
- Keep fresh-attempt initialization separate from checkpoint respawn restoration.
  - Rationale: manual restart and new stage entry still need to rebuild the finite coin set from authored data, while checkpoint respawn must preserve within-run progress.
  - Alternative considered: reuse the checkpoint restore path for all stage starts. Rejected because it risks leaking prior-run collectible state into a new attempt.

## Risks / Trade-offs

- [Risk] Clearing all powers on the first protected hit may feel harsher when multiple powers are active. -> Mitigation: keep the rule explicit in specs and player-facing messaging so the trade-off is intentional and readable.
- [Risk] Coin persistence can fail if collected coins are not tracked with stable per-stage identities. -> Mitigation: implement regression coverage against the existing authored finite coin set and persist deterministic coin identifiers or indexes.
- [Risk] Extending checkpoint restore state can accidentally persist unrelated transient gameplay state. -> Mitigation: scope the preserved data to collected coin state, coin totals, and one-time reward gating only.

## Migration Plan

No saved-data or deployment migration is expected. The change is limited to runtime stage-session behavior and can be rolled back by restoring the prior damage and checkpoint collectible rules.

## Open Questions

No open product questions remain for proposal stage. This design assumes that any active power counts as the one-hit shield and that all active powers are removed together when the shield absorbs a hit.