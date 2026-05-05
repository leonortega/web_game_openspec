## Context

The requested fix crosses the HUD rendering layer and the core damage simulation path. Today the primary stage label is formatted from the HUD view model as `stageName (targetMinutes m+)`, which exposes duration-planning metadata on the most prominent player-facing HUD surface. In the simulation, `damagePlayer()` treats any active power as a generic shield and delegates to `clearActivePowers()`, which also zeroes the invincibility timer. Because invincibility uses both an active-power flag and a timer-backed lifetime, the generic clear path removes it on contact even though the intended behavior is for invincibility to remain active until its timer expires.

## Goals / Non-Goals

**Goals:**
- Show only the authored stage name on the main gameplay HUD stage label.
- Preserve invincibility across damaging contact while its timer remains active.
- Keep existing powered-hit behavior for non-invincible powers, including mixed-power cases where invincibility and other powers are active together.
- Update regression coverage and any player-facing rule text that would otherwise misdescribe the new powered-hit behavior.

**Non-Goals:**
- Remove stage duration targets from authored content, playtest tooling, or non-player-facing metadata.
- Rebalance invincibility duration, knockback, or contact-damage cadence.
- Change how death clears powers or how unpowered hits remove health.

## Decisions

- Limit the copy change to the primary gameplay HUD stage label.
  - Rationale: the request points to the player-visible title surface, and `src/ui/hud/hud.ts` is the only clearly identified formatter adding the suffix. This keeps authoring duration metadata available elsewhere if the codebase still needs it.
  - Alternative considered: remove `targetMinutes` from every view model and data bridge immediately. Rejected because that would expand scope beyond the identified player-facing surface and may remove useful non-HUD metadata.
- Make powered-hit clearing selective instead of reusing the full `clearActivePowers()` reset path when invincibility is active.
  - Rationale: invincibility is represented by both `activePowers.invincible` and `powerTimers.invincibleMs`, so preserving it requires a narrower hit-consumption path that clears only the other powers and their side effects while keeping the invincibility timer authoritative.
  - Alternative considered: special-case invincibility by restoring its flag and timer after calling `clearActivePowers()`. Rejected because it couples retention to a destructive reset path and risks losing invincibility-adjacent state such as presentation and future timers.
- Keep knockback, temporary player invulnerability, hurt cue, and shield messaging aligned with the existing protected-hit flow.
  - Rationale: the requested change is retention of invincibility, not a broader damage-system redesign. The player should still get the normal protected-hit feedback while only the power-loss semantics change.
  - Alternative considered: suppress all hurt feedback while invincibility is active. Rejected because it would change combat readability and is not required by the request.
- Cover the rule in both simulation tests and spec text for progression/controller behavior.
  - Rationale: the current tests and specs explicitly encode "clear all active powers," so apply must update both executable and written contracts to avoid reintroducing the old rule.
  - Alternative considered: rely on a single unit test change. Rejected because the behavior is shared across multiple capability specs and the proposal must remain archive-safe.

## Risks / Trade-offs

- [Risk] Selective power clearing could leave stale movement or combat state behind for non-invincible powers. -> Mitigation: implement the hit-clear path in terms of explicit per-power cleanup and add a mixed-power regression test.
- [Risk] Keeping `targetMinutes` in upstream HUD data may leave dead fields after the copy change. -> Mitigation: apply may remove unused fields only if they are no longer consumed elsewhere, but the spec change does not require that cleanup.
- [Risk] Existing player-facing text may still imply every powered hit clears all powers. -> Mitigation: audit HUD/status strings and updated specs during apply, changing only the surfaces that describe the old rule.