## Context

The game already supports authored reveal platforms that begin hidden and become persistent traversal state after a nearby reveal trigger, and it already uses attempt-time runtime state for hazards and other timed gameplay behavior. This change adds a more time-sensitive traversal variant that still stays inside those existing patterns: a scanner switch opens a bridge briefly, the player crosses it, and the bridge shuts off again without introducing a general puzzle framework, a new interact button, or a broader gravity/platform rewrite.

This work overlaps authored stage fixture validation, runtime traversal state, scene synchronization, and automated playtest coverage. The existing archived reveal-platform change is the closest precedent, and the active stage-layout-safety-and-turret-telegraph work may touch adjacent stage fixtures and playtest coverage, so the design keeps the authored data model narrow and explicit.

## Goals / Non-Goals

**Goals:**
- Add scanner switches as authored proximity/contact triggers using an existing interaction model.
- Add temporary floating bridges whose visibility and solidity are controlled by attempt-scoped runtime state plus a countdown timer.
- Define exactly when the timer starts, how re-triggering behaves, and what happens when the timer elapses while the player is standing on the bridge.
- Define reset behavior for death, checkpoint respawn, manual restart, and fresh attempts.
- Reuse existing reveal-platform and timer patterns where they fit, and cover the new rules with tests and playtest assertions.

**Non-Goals:**
- Add gravity inversion columns, anti-grav streams, magnetic platforms, or any directional-gravity mechanic.
- Add a general-purpose puzzle framework, a new interact button, or a shooter-power-gated activation rule.
- Redesign checkpoint persistence globally or change unrelated platform behaviors beyond what temporary bridges require.

## Decisions

- Activate scanner switches through authored proximity/contact volumes, using the same enter-volume style interaction model already used for reveal triggers.
  - Rationale: this keeps the mechanic readable, avoids a new interact input, and does not force the route to depend on the shooter power.
  - Explicit rule: a scanner switch activates when the player enters its authored scanner volume. No projectile hit is required or supported for this bounded change.
  - Alternative considered: projectile-hit activation. Rejected because it would either require the shooter power for route access or add extra fairness rules for non-shooter routes.
- Model each temporary bridge as an authored platform record linked to a stable scanner-switch identifier, with runtime fields for active/inactive state and remaining bridge time.
  - Rationale: this mirrors the reveal-platform pattern of stable authored IDs plus simulation-owned runtime state, while adding only the timer state needed for the temporary behavior.
  - Alternative considered: infer scanner/bridge links from spatial overlap or array order. Rejected because authoring edits would make the links fragile.
- Start the bridge timer on the same simulation update in which the scanner switch transitions from inactive to active and the linked bridge becomes visible and solid.
  - Rationale: this gives a single deterministic activation moment for rendering, collision, and tests.
  - Alternative considered: start the timer only when the player first steps onto the bridge. Rejected because it weakens the intended timing pressure and breaks the scanner-switch fantasy.
- Allow the countdown to reach zero while the player is still standing on the bridge, but defer removal until the player no longer has top-surface support contact.
  - Rationale: this reuses the existing fairness principle from unstable-platform support, so the bridge does not drop the player through active support on the exact expiry frame.
  - Resulting rule: once the timer has elapsed, the bridge stays visible and solid only until the player leaves top-surface contact; after that, it immediately returns to hidden and non-solid.
  - Alternative considered: remove the bridge immediately at timer expiry even if occupied. Rejected because it would create unreadable failures and contradict current support fairness patterns.
- Permit re-triggering to refresh the full timer only when the player causes a new activation event by leaving and re-entering the scanner volume.
  - Rationale: this makes recovery possible after a mistimed attempt without allowing the timer to refresh every frame while the player stands inside the trigger.
  - Alternative considered: one-shot switches with no refresh. Rejected because a single missed crossing could make optional routes feel arbitrarily dead for the remainder of a life.
- Reset scanner switches and temporary bridges on death, checkpoint respawn, manual restart, and fresh attempts instead of snapshotting active timers into checkpoint persistence.
  - Rationale: reveal-platform persistence represents durable route discovery, but temporary bridges represent live timing state. Restoring an in-progress timer from checkpoint data would be hard to read and brittle to test.
  - Explicit rule: checkpoint snapshots do not preserve active temporary bridge state or remaining time; every respawn rebuilds these elements as inactive, hidden, and non-solid until retriggered.
  - Alternative considered: preserve active bridges and remaining time if a checkpoint is activated while a bridge is live. Rejected because the timing window would become inconsistent or degenerate on respawn.
- Keep collision and timer authority in simulation state, and let the Phaser scene mirror active versus inactive bridge presentation from that state.
  - Rationale: the mechanic changes both traversability and timing, so simulation must remain the source of truth.
  - Alternative considered: manage bridge visibility entirely in the scene. Rejected because view-only timers could drift from gameplay collision.

## Risks / Trade-offs

- [Readability risk] A timer that is too short could make bridges feel unfair even with support-safe expiry. -> Mitigation: keep the spec on behavior, then tune duration and authored distances during apply with playtest coverage.
- [State risk] Resetting bridges on checkpoint respawn differs from persistent reveal-platform behavior and could be implemented inconsistently. -> Mitigation: add explicit state tests for death, checkpoint respawn, and fresh-attempt resets.
- [Authoring risk] Scanner volumes and bridge links can drift out of sync or duplicate identifiers. -> Mitigation: validate authored IDs and fail fast in stage-content fixtures or tests.
- [Overlap risk] Stage fixture updates may intersect with the active layout-safety work. -> Mitigation: keep the proposal scoped to artifact-level requirements and call out playtest updates as a coordination point during apply.

## Migration Plan

1. Extend stage content definitions and validation for scanner switches, linked temporary bridge records, and stable authored IDs.
2. Update runtime state and `GameSession` logic so switch activation, timer countdown, support-safe expiry, and reset behavior are resolved in simulation.
3. Mirror temporary bridge visibility and solidity in `GameScene` and author at least one optional route that exercises the mechanic.
4. Add unit tests and stage playtest coverage for activation timing, timer refresh, occupied expiry, and reset behavior before implementation is considered complete.

## Open Questions

- No artifact blocker remains. Exact bridge durations, warning presentation, and authored placements can be tuned during apply as long as they preserve the activation, refresh, and reset rules defined here.
