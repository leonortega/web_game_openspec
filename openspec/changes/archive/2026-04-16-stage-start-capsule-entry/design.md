## Context

The current flow is `menu or complete scene -> stage-intro -> game`, but the transition stops at a text-and-status surface and gameplay begins with the player already present at the spawn point. Exit completion already has a bounded in-world capsule finish, while checkpoint respawns stay entirely inside the active `GameScene` and do not recreate the intro flow.

This change needs to add a mirrored arrival beat for fresh stage entry and next-stage auto-advance without reopening checkpoint behavior, respawn rules, or broader transition-scene presentation work. The live retro-presentation contract also currently reserves teleport or dematerialization feedback for valid stage completion only, so the design must explicitly separate stage-start appearance feedback from exit-only disappearance feedback.

## Goals / Non-Goals

**Goals:**
- Add a short capsule-style player arrival at the start of a fresh stage attempt and after automatic progression into the next stage.
- Preserve readable `StageIntroScene` status content and keep the handoff into active play automatic and bounded.
- Keep checkpoint respawns on their existing path with no intro replay and no new arrival sequence.
- Reuse the existing capsule visual language where practical so apply work stays narrow and consistent.

**Non-Goals:**
- Changing checkpoint respawn semantics, restart rules, or stage objective persistence.
- Adding a new transition scene, new checkpoint presentation, or a broad respawn presentation system.
- Requiring new audio cues or reusing the exact exit-only teleport cue as part of this change.
- Reworking stage-clear timing, menu flow, or the existing exit-finish ownership path.

## Decisions

### Keep stage-start arrival state local to GameScene
The arrival beat should be implemented as a short `GameScene`-local start gate that activates when the scene is created from the normal `stage-intro` handoff. The scene can use the existing spawn position from session state, temporarily suppress normal player control and ordinary player-part presentation, and resolve into the existing live gameplay state when the arrival completes.

This avoids adding a new session-wide respawn mode or mutating checkpoint rules. Checkpoint respawns already happen inside an existing `GameScene` instance, so a scene-local start gate gives a clean mechanical boundary between fresh stage entry and same-attempt respawn.

Alternative considered: model the arrival as a new `GameSession` simulation state similar to `exitFinish`. This was rejected because it would widen the change into checkpoint and simulation semantics without clear benefit.

### Keep StageIntroScene as the status surface and hand off directly into the in-world arrival
`StageIntroScene` should remain responsible for the readable stage identity and status panel. After its current bounded intro interval, it should continue to start `game`; the arrival beat then happens inside the world view instead of adding another scene or embedding world-space capsule animation into the intro scene.

This keeps scene ordering stable, avoids duplicating gameplay-world rendering inside a transition scene, and preserves the existing intro contract that the pre-stage surface is primarily informational.

Alternative considered: move the arrival animation into `StageIntroScene` or add a dedicated entry scene. This was rejected because it would duplicate world layout concerns and increase transition complexity for a small presentation change.

### Mirror exit capsule language visually, but keep exit-only disappearance semantics explicit
The stage-start effect should reuse the same capsule style family as the completion endpoint, but the beat should read as an arrival or rematerialization at the player spawn rather than an exit-trigger disappearance. The implementation should prefer shared presentation helpers or shared constants for capsule shell, door, timing, and visibility thresholds where practical during apply so entry and exit do not drift apart visually.

At the spec level, the change should explicitly allow stage-start appearance feedback while preserving the rule that exit-only disappearance and valid-completion teleport ownership stay tied to actual stage completion.

Alternative considered: reuse the exact exit cue and semantics in reverse. This was rejected because it would blur the exit-only contract and likely widen audio scope beyond what this proposal needs.

### Freeze active play until the arrival beat resolves
During the bounded arrival window, the player should not receive control and the stage should not be able to fail from immediate hazard contact before the appearance resolves. Apply can satisfy this either by pausing session advancement during the arrival window or by feeding neutral input while keeping collision and death semantics suppressed until control begins, but the result must be equivalent: active play starts only after the arrival completes.

Alternative considered: let simulation run normally while only animating a cosmetic overlay. This was rejected because it can desynchronize moving hazards, allow instant spawn failures, and make the arrival feel decorative instead of part of the stage-start contract.

## Risks / Trade-offs

- [Arrival increases pre-control time] -> Keep the beat short and bounded, and preserve automatic handoff with no extra player confirmation.
- [Entry and exit capsule visuals drift apart] -> Centralize shared presentation constants or helpers during apply instead of duplicating timing and shape values in multiple branches.
- [Checkpoint respawns accidentally trigger the new effect] -> Cover fresh start, next-stage auto-advance, and checkpoint respawn with explicit scene-flow and simulation tests.
- [Stage timing feels inconsistent across intro and gameplay start] -> Treat the arrival as the final part of the pre-play handoff and verify that the player becomes active only after the appearance resolves.