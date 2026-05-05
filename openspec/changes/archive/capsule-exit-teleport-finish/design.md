## Context

The current exit flow is mechanically simple: when the player overlaps the exit in a valid active state, the stage completes immediately and gameplay hands off to the completion scene after a short fixed delay. Visually, that endpoint still reads as a dimmed door-like prop, and the player does not perform a specific completion action beyond touching it. Audio at that moment is also generic rather than tied to a bespoke exit identity.

This change crosses simulation, scene presentation, boot-time texture generation, and synthesized audio routing. It benefits from a design artifact because the completion effect must remain bounded, preserve existing unlock and objective semantics, and handle a multipart player presentation cleanly without leaving the completion flow ambiguous.

## Goals / Non-Goals

**Goals:**
- Introduce a short capsule-entry teleport finish that begins on valid exit completion and resolves before the normal completion scene handoff.
- Preserve current completion eligibility rules for alive-state checks, stage objective gating, progression unlocks, and overall scene ordering.
- Give the exit endpoint a clearer capsule identity and pair the finish moment with a dedicated synthesized teleport cue.
- Define validation targets for simulation behavior, audio routing, and stage-flow timing so apply work remains bounded.

**Non-Goals:**
- Redesigning stage-clear or congratulations scenes.
- Adding alternate exits, branching progression, or new checkpoint semantics.
- Reworking player movement, collision, or death rules outside the bounded finish state.
- Introducing sampled audio assets or non-synthesized completion sound paths.

## Decisions

### Add a bounded pre-handoff completion substate instead of marking gameplay instantly finished in scene code
The implementation should add a small runtime completion substate in the simulation or session snapshot that starts when the player reaches a valid exit and lasts only for the teleport finish window. That substate should capture the exit contact moment, identify that the player is in an exit-finish sequence, and expose enough timing information for the scene to render the animation before the existing completion handoff proceeds.

This keeps completion semantics rooted in simulation state rather than ad hoc scene timers, which is safer for tests and easier to reason about if the exit sequence needs to freeze player control, stop repeat triggers, or survive one render frame of delay.

Alternative considered: keep simulation unchanged and have `GameScene` infer the finish sequence from the completion event alone. This was rejected because scene-only inference would make tests weaker, increase duplicate timing logic, and make it harder to guarantee a single completion trigger.

### Freeze the player into a non-interactive finish presentation while preserving the current exit gating rules
Once the valid exit overlap occurs, player control and normal gameplay interactions should stop for the short finish window, but the existing rules for *when* that overlap is accepted should remain unchanged. The exit finish state should therefore happen only after the current completion checks pass; it should not broaden what counts as a valid clear or allow repeated exit activations.

Alternative considered: change collision or overlap semantics to require a new explicit enter action or tighter position test. This was rejected because the request is about feedback and endpoint identity, not about making stage completion harder or more brittle.

### Render the dematerialization as a scene-side bounded retro effect driven by aggregated player presentation data
The player is multipart, so the finish effect should not assume a single sprite that can simply fade out. The scene should derive the effect from the existing player presentation data, treating the astronaut as a grouped silhouette or tightly bounded cluster for the teleport effect while allowing the constituent pieces to collapse, flash, or disappear in sync. The effect should stay short, local to the exit, and readable against nearby terrain, matching the repository's restrained retro presentation rules.

Alternative considered: swap the multipart player for a one-off single finishing sprite. This was rejected because it would create extra art-path complexity and risk visual mismatch at the most visible completion moment.

### Give the exit object a capsule identity through the existing retro asset-generation path
The exit should read as a grounded capsule endpoint rather than a generic dimmed door. The lowest-risk path is to update the generated exit art or render data in the current retro presentation pipeline so the same gameplay object can present as a capsule without introducing a new gameplay entity type.

Alternative considered: add a fully separate exit actor with its own simulation shape and interaction code. This was rejected because it broadens scope from presentation into data-model changes without clear gameplay benefit.

### Trigger a dedicated synthesized teleport cue at finish start and let existing transition audio remain responsible for results-surface celebration
The new audio cue should fire when the exit-finish sequence starts, not when the later completion scene appears. That separates the in-world teleport moment from the transition-surface stage-clear stinger and preserves the existing division between gameplay feedback and transition audio. The cue should stay on the current synthesized audio path and remain original to the repository's retro style rather than imitating a known teleport sound.

Alternative considered: replace the completion-scene stinger with the teleport cue entirely. This was rejected because the handoff distinguishes the in-world entry moment from the later results surface and the current transition-audio contract should remain intact.

### Validate with simulation tests plus stage-flow coverage focused on the finish window
Apply should update simulation tests to confirm valid completion still gates correctly, the finish state does not retrigger, and the handoff occurs after the bounded finish window. Audio tests or routing assertions should confirm the dedicated cue fires exactly once. Build and stage-flow playtesting should verify the player disappears before the normal completion surface appears.

## Risks / Trade-offs

- A new finish substate could accidentally delay or duplicate stage completion if timers or transition checks diverge. → Mitigation: keep a single authoritative completion timer in session state and cover it with simulation tests.
- The multipart player could dematerialize unevenly and look messy near the capsule. → Mitigation: drive the effect from grouped presentation bounds and use a simple synchronized hide or collapse treatment rather than per-part bespoke choreography.
- The teleport cue could overlap awkwardly with existing completion audio. → Mitigation: trigger the new cue at finish start and keep transition-surface stingers on their existing later timing.
- Updating exit art could accidentally reduce endpoint readability in busy scenes. → Mitigation: keep the capsule silhouette grounded, high-contrast, and close to the current exit footprint.

## Migration Plan

No data migration is required. The change can ship as a bounded runtime and presentation update. Rollback is a straightforward revert of the exit art, finish-state plumbing, and teleport cue routing if regressions appear.

## Open Questions

None. The request and explore handoff are specific enough to proceed to apply with a bounded finish-state implementation.