## Context

Stage fiction already references relays, beacons, and lift infrastructure, but the runtime has no stage-level objective state and treats valid exit contact as immediate completion. The codebase already has transient stage messaging plus contact- and volume-driven activators, so the change should reuse those patterns instead of introducing a parallel mission layer.

## Goals / Non-Goals

**Goals:**
- Add an optional authored stage-objective block for a small rollout of stages.
- Track objective completion inside the existing stage/session runtime so selected stages can require that completion before exit clear.
- Reuse existing activation, contact, and message surfaces rather than adding a new interaction model.
- Keep the implementation and authored data small enough to validate with focused tests and scripted playtest coverage.

**Non-Goals:**
- Build a general mission journal, quest log, map-marker system, or multi-objective tracker.
- Rework the full stage catalog around objectives.
- Add a new persistent HUD panel dedicated to mission state.
- Change global progression, unlock rules, or non-objective stage completion behavior.

## Decisions

- Add one optional `stageObjective` definition to authored stage data for this rollout.
  - Rationale: one bounded objective per participating stage keeps authored data simple and avoids inventing a separate mission schema.
  - Alternative considered: allow multiple concurrent objectives or arbitrary task lists. Rejected because it would create a broader mission system and increase UI/state complexity immediately.
- Treat the presence of a stage objective as an implicit exit gate for that stage.
  - Rationale: this makes authored behavior deterministic and avoids a second flag that could desynchronize objective messaging from completion rules.
  - Alternative considered: allow optional objectives that do not affect exit completion. Rejected because the requested gameplay value comes from tying the fiction to stage completion flow.
- Track runtime objective progress as lightweight stage-attempt state, centered on an incomplete/completed outcome with an authored target binding.
  - Rationale: a small boolean-style completion state fits the existing session model, is easy to snapshot or restore, and avoids a catalog-wide state migration.
  - Alternative considered: create a reusable mission-state subsystem with richer progress counters. Rejected because it exceeds the bounded scope and is unnecessary for a first rollout.
- Reuse existing activation patterns and transient stage messaging for objective feedback.
  - Rationale: existing activators, scanners, checkpoints, and message surfaces already teach the player to react to contact-based events, so objective communication can stay inside the current stage flow.
  - Alternative considered: add a dedicated mission HUD or interact prompt. Rejected because it adds new presentation and control surface area for a change that should remain lightweight.
- Limit implementation rollout to a small authored subset of stages with clear existing fiction and activator opportunities.
  - Rationale: this keeps regression scope manageable while proving the pattern on real content.
  - Alternative considered: retrofit all authored stages immediately. Rejected because it would turn a bounded stage-flow change into a catalog-wide content pass.

## Risks / Trade-offs

- [Risk] An authored objective target could become unreachable and soft-lock stage completion. → Mitigation: validate authored objective bindings and cover an incomplete-exit path plus a complete-exit path in scripted playtests.
- [Risk] Message-only communication could be missed by players who rush forward. → Mitigation: replay the reminder through the existing transient message flow when the player touches the exit before completing the objective.
- [Risk] Objective state could interact poorly with checkpoint restore rules. → Mitigation: keep the tracked state minimal and define completion persistence explicitly for the current attempt.
- [Risk] Even a small rollout can expand if stage authors treat objectives as a new default mechanic. → Mitigation: cap the first implementation to one or two representative stages and document the bounded rollout in tasks.

## Migration Plan

1. Extend stage authored data and validation with an optional single-objective definition that binds to an existing activation/contact source and supported objective kind.
2. Carry objective state through runtime stage/session flow, including incomplete-exit handling and attempt-reset behavior.
3. Wire transient objective briefing and reminder text through existing scene bridge and gameplay message surfaces without adding a new mission UI.
4. Update one or two authored stages plus focused automated and scripted playtest coverage to verify objective activation, respawn behavior, and gated completion.

## Open Questions

- No proposal-stage blocker remains; implementation should choose the smallest authored stage subset that already has clean activator hooks for beacon, relay, or lift-tower fiction.