## Context

The repo already supports bounded traversal mechanics through authored geometry plus small runtime state: reveal volumes, scanner switches, temporary bridges, and activation nodes all use nearby contact-style triggers instead of a general-purpose interaction system. Gravity fields currently sit outside that family. They are simple always-on rectangles with translucent rendering, no shell or door framing, no enabled state, and no validation that the authored route inside a more contained presentation remains readable or retry-safe.

This change needs to touch authored stage metadata, runtime traversal state, validation, and scene presentation, but it should stay narrower than a generalized activation framework. The requested ambiguity around the button should be resolved with the repo's existing proximity or contact pattern rather than with a new interact prompt, projectile trigger, timed toggle, or multi-button logic.

## Goals / Non-Goals

**Goals:**
- Add one bounded gravity-capsule section pattern that encloses an anti-grav stream or gravity inversion column inside a readable shell.
- Define one repo-consistent activation-button behavior: first eligible player contact latches the linked capsule section enabled on that same update and keeps it enabled until a reset event.
- Keep gravity effects limited to the player and only to airborne vertical acceleration, matching the current field family.
- Add route-containment and retry-safety rules so a capsule section includes readable internal support geometry and does not strand the player when it resets dormant.
- Define dormant versus enabled presentation rules that stay visually distinct from the stage-completion capsule.

**Non-Goals:**
- A new general interaction system, HUD prompt, or explicit use button.
- Toggle-off behavior, time-limited activation, multi-button chaining, or arbitrary trigger graphs.
- Ceiling walking, wall adhesion, vector gravity, grounded orientation changes, or non-player gravity effects.
- Replacing the existing stage-exit capsule or changing completion semantics.
- Broadening capsule sections into puzzle-room logic beyond one linked button and one linked field section.

## Decisions

### Model a gravity capsule section as authored shell metadata plus one linked gravity field and one linked button
The authored data should treat each gravity capsule section as a bounded group with stable identifiers for the shell section, its internal gravity field, and its activator button. The field itself can continue to use the current rectangular airborne-effect model, but the capsule grouping adds the authoring and validation context needed for shell presentation, enabled-state gating, and contained route checks.

This keeps the runtime change additive instead of rewriting the field system into arbitrary shapes.

Alternative considered: replace rectangular fields with fully capsule-shaped collision or force volumes. Rejected because the field behavior itself is already bounded and sufficient; the missing piece is activation and route containment, not continuous arbitrary geometry.

### Resolve button semantics as a latched contact or proximity activator with no toggle-off path
The button should trigger from direct player contact using the same family of semantics as scanner switches and activation nodes. On the first eligible contact, it enables the linked capsule section on that same simulation update and stays enabled until death, checkpoint respawn, manual restart, or fresh stage start. It does not require a new interact input, and later contact does not toggle the section back off.

This is the narrowest useful interpretation of "button" in this repo. It preserves readable cause and effect while avoiding new input handling or timing complexity.

Alternative considered: a hold-to-keep-open floor switch or true toggle button. Rejected because both variants would broaden the mechanic into timing or state-puzzle authoring that the handoff explicitly treats as risk.

### Keep simulation authoritative for capsule enabled state and field gating
Capsule enabled state affects gameplay because it determines whether airborne acceleration changes apply. That state should therefore live in simulation-owned session state, not only in scene presentation. The scene should mirror dormant versus enabled shell, door, and button visuals from simulation state, while field application, reset behavior, and tests stay deterministic in simulation.

Alternative considered: infer enabled state in the scene from button overlap and drive only visuals there. Rejected because the controller and validation need one authoritative answer for whether the field is active.

### Treat capsule activation as retry-local traversal state instead of checkpoint-persistent discovery
Like temporary bridges and magnetic platforms, a gravity capsule section should reset to dormant on death, checkpoint respawn, manual restart, and fresh attempts. Checkpoint snapshots must not restore an already enabled capsule. This keeps the mechanic deterministic, preserves a clear dormant baseline, and avoids coupling checkpoint persistence to mechanic-specific activation rules.

Alternative considered: preserve enabled state if the checkpoint was touched after activation. Rejected because it would add authoring edge cases and weaken the requirement that the route remain retry-safe when the capsule is dormant.

### Validate the authored route as a contained section rather than only a rectangle in empty space
Validation should require the capsule section to include readable internal or capsule-local route geometry, a linked button on an intended reachable approach, and a safe retry path when the section is dormant until retriggered. This directly addresses the current gap where rectangular fields can be valid without proving the capsule-shaped route inside them is actually traversable.

Alternative considered: rely on manual playtest only for containment quality. Rejected because malformed contained routes are a predictable regression point and should fail authoring tests before runtime use.

### Keep the presentation visually capsule-like but explicitly distinct from the stage exit
The shell, door, and button visuals should read as traversal infrastructure, not as a completion endpoint. The safest path is to reuse the repo's retro shape language while differentiating the traversal capsule through side-on framing, button affordance, dormant or enabled shell cues, and the absence of exit-finish effects.

Alternative considered: reuse the exact stage-exit capsule silhouette and color treatment. Rejected because the handoff explicitly calls out confusion risk.

## Risks / Trade-offs

- [Authoring risk] A capsule can look contained but still fail to provide a reachable internal line. -> Mitigation: require validation for linked button placement, contained route geometry, and retry-safe fallback.
- [State risk] Resetting capsules to dormant on respawn can break progression if a route assumes persistence. -> Mitigation: require the stage to remain completable when dormant until the button is retriggered.
- [Readability risk] Players may mistake a traversal capsule for the exit capsule. -> Mitigation: require distinct shell and button presentation and explicitly avoid exit-finish feedback on traversal capsules.
- [Scope risk] Button requests can easily drift toward toggle puzzles or multi-trigger graphs. -> Mitigation: state in proposal and specs that the mechanic is one linked button, latched enable, and reset-only disable.

## Migration Plan

No migration is required. Apply should extend stage metadata and validation, add runtime enabled-state support, update scene presentation, and cover the mechanic with automated and scripted checks. Rollback is a straightforward revert of the new capsule authoring fields, enabled-state plumbing, and presentation cues.

## Open Questions

No apply blocker remains. Exact sprite or generated-shape treatment for the shell, door, and button can be decided during apply as long as traversal capsules remain locally readable, latched by contact, and visually distinct from stage exits.