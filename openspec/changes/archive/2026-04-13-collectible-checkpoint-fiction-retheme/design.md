## Context

The current run presents collectible and checkpoint terminology through multiple player-facing layers, including active-play HUD copy, in-stage messaging, and the intro/results transition flow. Those surfaces do not currently share one fiction contract, which makes the same underlying mechanics read as different things depending on where the player sees them. The requested change is explicitly bounded to presentation only: internal coins, checkpoints, reward-block payouts, checkpoint snapshots, respawn placement, collectible counts, and the full-clear energy restore rule must remain unchanged.

## Goals / Non-Goals

**Goals:**
- Define one coherent player-facing noun strategy for collectibles and checkpoints.
- Keep stage-local and run-total collectible labels in the same noun family so the player does not need to reinterpret totals between screens.
- Preserve internal mechanic names and progression logic while updating only the presentation layer and surfaced copy.
- Make the HUD, stage messages, and transition screens read consistently under the same fiction contract.

**Non-Goals:**
- Rename coin or checkpoint fields, enums, save state, or simulation logic.
- Change collectible counts, reward-block payout logic, checkpoint activation rules, respawn placement, or checkpoint persistence.
- Rebalance pickup audio, checkpoint cadence, or the full-clear energy restore behavior.
- Introduce a new progression system, collectible type, or checkpoint mechanic.

## Decisions

- Use a presentation-layer mapping instead of renaming internal mechanics.
  - Rationale: the change request is fiction and presentation only, and the affected code touches multiple systems that already rely on coin and checkpoint semantics. Keeping those mechanics stable avoids accidental progression regressions.
  - Alternative considered: rename internal state and events from coins/checkpoints to new fiction terms. Rejected because it expands scope into simulation, persistence, and test rewrites that the request explicitly excludes.
- Use `research sample` / `research samples` as the single collectible noun family everywhere the player sees collectible progress.
  - Rationale: one noun across stage-local and run-total displays removes the current inconsistency and keeps totals comparable between HUD, stage messaging, and results screens.
  - Alternative considered: use one noun for stage-local pickups and another for run-total progression. Rejected because it would preserve the same naming split the change is intended to remove.
- Use `survey beacon` / `survey beacons` as the player-facing checkpoint term.
  - Rationale: checkpoints are fixed world markers, and `survey beacon` reads clearly for activation, respawn, and status copy without implying a new mechanic.
  - Alternative considered: `expedition uplink`. Rejected because it implies a stronger communications-system fiction than the current checkpoint interaction needs and is less natural for stage-level activation copy.
- Centralize fiction labels in shared presentation/view-model code instead of hardcoding scene-by-scene strings.
  - Rationale: the affected surfaces span gameplay HUD, stage scenes, and transition scenes. A shared mapping reduces the chance that one screen keeps stale terminology.
  - Alternative considered: update each scene independently. Rejected because it makes future copy drift more likely and weakens regression coverage.
- Treat audio as event-consistent rather than mechanically changed.
  - Rationale: collectible and checkpoint sounds should stay attached to the same events; only the surfaced fiction describing those events changes.
  - Alternative considered: treat the fiction rename as a reason to retune or replace sounds. Rejected because that would add scope beyond naming consistency.

## Risks / Trade-offs

- [Risk] A few bespoke strings may remain on less obvious stage-message paths and preserve old terminology. -> Mitigation: implementation should audit the listed gameplay and transition touchpoints together instead of updating only the HUD.
- [Risk] Shared presentation mapping can be bypassed if a scene continues to format labels locally. -> Mitigation: route collectible and checkpoint nouns through the same bridge/view-model helpers used by all player-facing surfaces.
- [Risk] `Survey beacon` is a firmer fiction choice than `expedition uplink` and may constrain later narrative copy. -> Mitigation: keep the abstraction at the presentation layer so future fiction refinements remain low-cost.

## Migration Plan

1. Add shared presentation terms for collectible and checkpoint labels without altering internal coin or checkpoint state.
2. Update gameplay HUD, in-stage messaging, and intro/results screens to consume the shared terms.
3. Verify that existing progression logic, payout behavior, checkpoint restore behavior, and full-clear energy recovery remain unchanged while copy updates land.
4. Roll back by reverting the presentation mapping and surface-level copy changes only; no data migration or save-state migration is required.

## Open Questions

None. This proposal intentionally fixes the noun strategy as `research samples` and `survey beacons` to keep the change apply-ready.