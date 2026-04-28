## Context

The explore handoff is specific: brittle should not behave like unchanged generic breakable support. Player should see status progression while occupying platform, and platform should break only after progression is complete and player leaves support. Existing contact-aware falling-platform timing from the prior change must stay intact and out of scope.

Current platform-variation spec mentions brittle warning and delayed break, but does not lock occupancy semantics tightly enough for stay vs walk vs jump edge cases. This leaves apply room for false-positive implementations that look animated but still break at the wrong time.

## Goals / Non-Goals

**Goals:**
- Define one deterministic brittle occupancy contract for simulation, rendering, and authored rollout.
- Resolve stay, walk, and hop-jump ambiguity so warning progression behavior is consistent and testable.
- Keep collapse timing readable: player can recognize when platform is armed-to-break but still supporting.
- Preserve prior falling-platform contact-aware semantics without change.
- Ensure current stage usage visibly demonstrates intended brittle behavior in gameplay routes.

**Non-Goals:**
- Reworking falling-platform timing thresholds or broadening unstable-platform behavior families.
- Adding new interact buttons, powers, HUD widgets, or checkpoint persistence mechanics for brittle state.
- Expanding brittle support to moving platforms or non-static platform classes.
- Introducing generic platform state machines shared by unrelated mechanics.

## Decisions

- Treat brittle progression as occupancy-time accumulation against existing authored brittle warning duration.
  - Rule: warning elapsed time increases only while player has top-surface support contact on that brittle platform.
  - Rationale: matches user intent that status changes while player stays, walks, or jump-traverses on support.
- Define occupancy continuity for short hop-jumps using existing contact-aware hop gap semantics.
  - Rule: unsupported gaps at or below `hopGapThresholdMs` continue the same occupancy window; larger unsupported gaps end the window.
  - Rationale: prevents tiny jump animation gaps from feeling like random resets while still giving deterministic behavior.
- Gate break by two conditions: warning complete, then support leave.
  - Rule: once warning reaches full duration, brittle enters ready-to-break state but remains valid support while top-surface contact is active.
  - Rule: break/fall triggers on first update where that ready platform no longer has player top-surface support.
  - Rationale: directly maps to requested behavior: progression while occupied, collapse once player leaves.
- Reset incomplete progression on occupancy loss before readiness.
  - Rule: if occupancy window ends before warning completes, brittle returns to intact state.
  - Rationale: keeps behavior readable and one-shot focused; avoids hidden partial arming across long disengagement.
- Require explicit readable states in scene presentation.
  - Rule: intact, warning-in-progress, and ready-to-break states must be visibly distinct before collapse.
  - Rationale: mechanic should be legible without reading code or waiting for surprise collapse.
- Keep falling-platform contact-aware semantics unchanged.
  - Rule: no apply work in this change may alter falling-platform arm or countdown rules from `2026-04-27-contact-aware-falling-platform-timing`.
  - Rationale: user requested preservation unless explicitly required.

## Risks / Trade-offs

- [Readability risk] Warning and ready-to-break visuals may be too subtle at movement speed. -> Mitigation: require state-distinct presentation and stage fixture checks in tasks.
- [Edge-case risk] Hop-gap continuity could accidentally couple brittle and falling timers incorrectly. -> Mitigation: isolate brittle runtime state and add explicit regression tests for both mechanics.
- [Authoring risk] Existing brittle placements might not showcase leave-trigger behavior clearly. -> Mitigation: include stage rollout task to place at least one obvious brittle beat where player can observe full cycle.

## Migration Plan

1. Extend brittle runtime state to track occupancy-window progression and readiness-to-break state transitions.
2. Update simulation rules to accumulate warning only during occupancy, apply hop-gap continuity, and trigger break on leave-after-ready.
3. Update scene presentation for three clear brittle states and collapse transition.
4. Update authored stage fixtures where needed so at least one current route demonstrates the intended readable brittle cycle.
5. Add regression tests for brittle occupancy progression and explicit non-regression tests for falling-platform contact-aware behavior.

## Open Questions

None for apply readiness. Visual styling details can be finalized during apply as long as all three brittle states remain clearly distinguishable.