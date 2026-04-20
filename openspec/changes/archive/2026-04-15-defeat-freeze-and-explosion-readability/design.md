## Context

The existing defeat-feedback path already emits distinct event classes for stomp enemy defeats, Plasma Blaster projectile defeats, and player death, but the event loses readability because the victim hides immediately and the current burst is still too subtle in live play. The explore handoff explicitly constrains this follow-up to presentation only: no defeat-rule changes, no control changes, and no respawn-cadence changes.

The implementation is likely cross-cutting across `GameScene`, the retro-presentation helper, boot-time particle texture setup, and the current tests that cover presentation wiring and session flow. Because the player and enemies already route defeat events through the scene and presentation helpers, this change should refine visibility timing and effect presets inside those existing paths rather than create a new pipeline.

## Goals / Non-Goals

**Goals:**
- Keep the defeated victim visible long enough for the defeat to register before hide or destroy cleanup.
- Add an immediate victim-side flash or tween so the defeat reads even before particles finish expanding.
- Replace the current tiny burst with a larger, brighter, longer-lived bounded local explosion that remains readable over busy gameplay art.
- Preserve distinct stomp, Plasma Blaster, and player-death feedback classes while keeping them in one shared retro presentation family.
- Preserve simulation semantics, defeat resolution, and respawn cadence.

**Non-Goals:**
- Add a new spritesheet asset pipeline, new external art dependency, or a separate overlay scene.
- Change enemy defeat semantics, player damage handling, checkpoint behavior, or respawn timing.
- Introduce screen-filling spectacle, long hit-stop pauses, camera shakes, or full-screen flashes.
- Rework unrelated presentation systems such as HUD layout, transition messaging, or non-defeat particles.

## Decisions

- Use the existing procedural retro-particle path rather than a spritesheet-based explosion.
  - Rationale: the current codebase already generates and spawns bounded retro particles, and the request can be satisfied by stronger presets plus one or two larger boot-generated textures. This keeps scope small and avoids adding new asset loading, atlas wiring, or authoring overhead for a presentation-only fix.
  - Alternative considered: introduce a dedicated explosion spritesheet. Rejected because it adds content-pipeline work and asset coordination that is disproportionate for a focused readability follow-up.
- Add a presentation-only victim-visible hold with explicit upper bounds instead of extending simulation timing.
  - Rationale: the main readability failure is that the victim disappears immediately. A short hold lets the flash and tween read, but bounding it keeps the effect local and ensures existing defeat and respawn flow remains intact.
  - Concrete direction: supported enemy defeats keep the victim visible for about 96 ms before hide or destroy cleanup, and player defeat keeps the victim visible for about 120 ms inside the existing non-controllable death presentation. These windows overlap the already-existing defeat flow rather than extending it.
  - Alternative considered: keep instant hide and only enlarge particles. Rejected because particles alone still leave the viewer without a clear body-side cue in the first few frames.
- Route defeat readability through one shared tween family with cause-specific presets.
  - Rationale: stomp, Plasma Blaster, and player death should feel related, but each still needs a readable identity. A shared helper can apply the same presentation vocabulary while varying recoil, squash, flash brightness, rotation, and fade by cause.
  - Concrete direction: stomp uses a fast squash-pop and warm flash, Plasma Blaster uses a sharper recoil with brighter flash and slightly wider breakup, and player death uses the strongest flash plus a brief blow-apart shrink or separation accent before hide.
  - Alternative considered: three entirely separate effect implementations. Rejected because it increases maintenance cost and risks visual drift.
- Increase defeat-burst readability with bounded local explosion presets and a total presentation cap.
  - Rationale: the current 4x4 burst is too easy to miss. A stronger effect needs more size, contrast, and life, but it must remain subordinate to route readability.
  - Concrete direction: use larger particles or runtime-generated burst textures, raise particle counts modestly, brighten palette contrast, and extend lifetime into roughly the 180-260 ms range with a hard cap that resolves all local defeat presentation within 320 ms of the trigger.
  - Alternative considered: use long-lived lingering embers. Rejected because they would accumulate visual noise and violate the local short-lived retro contract.
- Keep respawn and defeat cleanup semantics unchanged by starting presentation changes at the current event boundary.
  - Rationale: this is a presentation-only change. The apply phase should attach the hold, tween, and explosion at the existing defeat trigger, while keeping damage rules, checkpoint selection, and respawn scheduling untouched.
  - Alternative considered: push respawn later to make the player-death effect more dramatic. Rejected because it violates the stated scope.

## Risks / Trade-offs

- [A stronger explosion could become noisy in mixed encounters] -> Cap particle counts and total lifetime, and keep the burst centered tightly on the victim's last position.
- [The visible hold could accidentally delay cleanup-dependent logic] -> Apply the hold only to render visibility and non-interactive presentation state, while preserving existing defeat event timing and respawn scheduling.
- [Shared tween helpers could erase class distinction] -> Keep one helper but require separate preset values for stomp, Plasma Blaster, and player death.
- [BootScene texture additions could spread scope] -> Limit new generated textures to the smallest set needed for a larger procedural explosion and reuse existing palette roles.

## Migration Plan

1. Update the spec deltas to codify the bounded hold, tween, and explosion readability requirements for retro presentation, enemy defeat, and player death.
2. In apply, wire `GameScene` defeat cleanup through short victim-visible presentation windows that do not alter defeat or respawn timers.
3. In apply, strengthen the retro-presentation presets and any required boot-generated textures, then validate that all three defeat classes remain local, distinct, and timing-safe.

## Open Questions

None for apply readiness. The design direction is intentionally fixed to bounded procedural explosions plus victim-side tween holds inside the existing defeat flow.