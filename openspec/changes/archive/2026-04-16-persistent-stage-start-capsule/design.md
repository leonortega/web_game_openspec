## Context

Fresh stage starts currently hand off from the intro surface into a short in-world arrival beat where the capsule is only a transient presentation element. Exit completion already owns the grounded persistent endpoint and disappearance semantics, while checkpoint respawns stay inside the active `GameScene` path and intentionally skip stage-start presentation.

This change keeps the existing fresh-start-only arrival gate, but the stage-start capsule now needs to remain on the map as a grounded inert prop after the player appears. The start capsule also needs a short bounded door-close beat before or as active control begins, and it must remain clearly separate from exit capsules and gravity capsules.

## Goals / Non-Goals

**Goals:**
- Keep the current fresh-stage and next-stage-auto-advance arrival path, while leaving behind a persistent grounded start capsule after player reveal.
- Add a short door-close animation on the start capsule after the player appears without extending stage flow beyond a bounded pre-control beat.
- Preserve the existing rule that checkpoint respawns within the same stage attempt do not replay stage-start presentation.
- Keep the start capsule purely visual and non-interactive so no new traversal, checkpoint, or exit behavior is introduced.
- Maintain clear visual separation between start capsules, exit capsules, and gravity capsules.

**Non-Goals:**
- Changing checkpoint semantics, restart rules, or stage objective flow.
- Introducing a reusable gameplay interaction for the start capsule after arrival.
- Adding new audio requirements or changing exit-finish timing semantics.
- Reworking stage-intro scene ordering, stage-clear flow, or broader transition-screen presentation.

## Decisions

### Keep start-capsule lifecycle local to fresh stage entry flow
The persistent capsule should be created only as part of the existing fresh-entry arrival sequence inside the gameplay scene, using the authored spawn position and the same fresh-start gating that already excludes checkpoint respawns. When the arrival completes, the capsule remains in place as an inert world prop instead of being destroyed immediately.

This preserves the clean separation between fresh stage starts and same-attempt respawns without introducing new global session state. The apply work can keep the persistence decision inside the same scene-local path that already knows whether the current spawn came from intro flow or from an in-stage respawn.

Alternative considered: persist the capsule through generic spawn-state handling shared by checkpoints. This was rejected because it risks replaying or restoring the prop on checkpoint respawns, which conflicts with existing stage-start rules.

### Bound the door-close beat after player reveal and before full control
The arrival sequence should reveal the player first, then run a short door-close animation on the capsule shell before or as normal active control begins. The beat must remain short enough to feel like the final moment of stage start rather than a second transition surface.

This gives the persistent prop a readable resolved state and satisfies the requested visual beat without widening stage timing. It also keeps the capsule obviously inert once gameplay is active because the close event has already finished.

Alternative considered: close the door before the player appears or leave the door permanently open. The first option weakens the reveal timing, and the second leaves the capsule looking unfinished or still usable.

### Treat the persistent start capsule as a dedicated visual state, not as a live device
After the arrival resolves, the remaining capsule should have no collision affordance, prompt, trigger, or replay path. Its final state should read as closed, grounded, and inactive, with presentation differences from the exit capsule and gravity capsules coming from local state cues, timing ownership, and the fact that only the exit owns disappearance-style completion feedback.

Alternative considered: allow later interaction or reuse as a checkpoint-like prop. This was rejected because it broadens scope into new gameplay semantics and muddies the distinction between stage-start, traversal, and completion devices.

### Reuse existing capsule presentation helpers where practical, but keep entry-specific state explicit
Apply work should prefer shared capsule drawing or animation helpers for shell geometry, door treatment, and timing constants where that reduces drift, but it should keep start-entry state separate from exit-finish state so entry-only appearance and post-reveal closure cannot accidentally trigger exit disappearance semantics.

Alternative considered: clone the exit presentation path and invert it for entry. This was rejected because it increases the risk of coupling entry behavior to completion-only cleanup and visibility rules.

## Risks / Trade-offs

- [Persistent start capsule adds visual clutter near spawn] -> Keep it grounded, inert, and compact so it reads as resolved stage-start infrastructure rather than a second objective.
- [Door-close timing slows stage starts too much] -> Keep the close beat brief and verify that active control still begins within the same bounded start window.
- [Start capsule is confused with exit or gravity capsules] -> Require distinct state cues and cover comparison cases in spec scenarios and scripted playtests.
- [Checkpoint respawns recreate or preserve the prop incorrectly] -> Gate creation to fresh-start flow only and verify checkpoint respawns continue to bypass the arrival sequence.