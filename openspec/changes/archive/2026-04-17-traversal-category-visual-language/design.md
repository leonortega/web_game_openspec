## Context

`platform-variation` now covers a broad set of authored traversal mechanics: moving and unstable supports, springs and launchers, reveal routes, temporary bridges, magnetic routes, gravity fields, and gravity capsule sections. The user handoff identifies `src/phaser/scenes/GameScene.ts` as the main live rendering path, with most of these mechanics still inheriting a shared rectangle-based presentation and only light tint differences. That makes the mechanics technically distinct but visually close, especially when route-toggle and gravity systems appear near moving or launcher geometry.

An earlier change already strengthened terrain readability for `brittleCrystal` and `stickySludge`, so this proposal should not reopen terrain surface work. The missing piece is a visual grouping model for the rest of the traversal catalog that helps players recognize which mechanics provide contact-driven assistance, which mechanics gate route availability, and which mechanics modify airborne gravity.

## Goals / Non-Goals

**Goals:**
- Establish stable category-level visual language for existing traversal mechanics without changing their authored behavior.
- Pin mechanic grouping so apply work does not invent a different category map mid-implementation.
- Keep the solution inside the current scene renderer with lightweight overlays, shapes, and stateful cues rather than a new art pipeline.
- Make dormant versus active route-toggle states readable locally for mechanics that enable or reveal support.

**Non-Goals:**
- Add new traversal mechanics, new stage-authored systems, or new platform-variation capabilities.
- Rework terrain surface readability already covered by the terrain visual distinction change.
- Replace the current Phaser scene rendering path with tilemaps, shaders, or a texture-atlas driven traversal renderer.
- Change controller, collision, timing, activation, or gravity semantics beyond what presentation needs to reflect.

## Decisions

- Use three explicit visual categories for this change: assisted movement, route toggles, and gravity modifiers.
  - Assisted movement includes spring platforms, bounce pods, gas vents, moving platforms, lift-style platforms, and unstable or falling support surfaces.
  - Route toggles includes reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule buttons or shell-state cues.
  - Gravity modifiers includes anti-grav streams, gravity inversion columns, and the enabled field interiors governed by gravity capsule sections.
  - Rationale: this split matches how the player reads the mechanics during traversal: contact-driven help, availability-gated routes, and airborne gravity spaces.
  - Alternative considered: classify gravity capsule sections wholly as route toggles. Rejected because their field interiors still need to read like gravity spaces after activation.

- Keep the renderer on the existing `GameScene.ts` primitive path and add reusable category overlays plus mechanic-specific accents.
  - Rationale: explore handoff and current repo patterns point to shared rectangle rendering as root cause. Adding bounded overlays and accents fixes readability near the source without introducing a second rendering system.
  - Alternative considered: create bespoke sprites or textures for every traversal mechanic. Rejected because it broadens scope and weakens reuse.

- Preserve mechanic-specific sub-identity inside each category instead of flattening everything into one family look.
  - Resulting requirement: assisted movement must still distinguish carry surfaces from impulse launchers; route toggles must still distinguish activators from governed supports; gravity modifiers must still distinguish anti-grav from inversion behavior.
  - Rationale: the point of category language is faster reading, not loss of mechanic precision.
  - Alternative considered: one iconographic cue per category with minimal per-mechanic differences. Rejected because springs, bounce pods, moving supports, and falling supports would remain too easy to confuse.

- Split gravity capsule presentation into two rendered roles.
  - Buttons and capsule shell readiness cues belong to the route-toggle family.
  - The enabled field interior belongs to the gravity-modifier family.
  - Rationale: this matches the mechanic's two-step reading: first enable a gated route element, then traverse a gravity field.
  - Alternative considered: keep the entire capsule section under one visual treatment. Rejected because it blurs activation state with field behavior.

- Validate the change through focused presentation coverage instead of generalized screenshot baselines.
  - Resulting approach: add tests or assertions that traversal mechanics map to the intended category cues and update targeted scripted playtests for one route per category.
  - Rationale: the repo already uses authored-data tests and scripted playtests; category mapping and state transitions are more durable than pixel-exact baselines here.
  - Alternative considered: golden-image screenshot tests. Rejected because they are brittle for this renderer and not currently part of the repo workflow.

## Risks / Trade-offs

- [Risk] Category overlays could become noisy and compete with collision silhouettes. → Mitigation: keep cues bounded, low-density, and secondary to route geometry.
- [Risk] Grouping unstable supports with assisted movement could confuse hazard reading if cues skew too friendly. → Mitigation: keep a support-family cue but retain failure-state accents and warning timing for unstable platforms.
- [Risk] Route-toggle cues might imply broader puzzle logic than the game actually supports. → Mitigation: keep all cues local to the activator and governed route and avoid HUD-style signaling.
- [Risk] Gravity capsule sections may still look visually mixed because they span two categories. → Mitigation: treat button and shell readiness separately from the field interior and make the transition explicit on activation.

## Migration Plan

1. Refactor the traversal rendering path in `GameScene.ts` so category overlays and mechanic accents can be applied without duplicating every branch.
2. Apply the category treatments to assisted movement, route toggles, and gravity modifiers, including gravity capsule split-role rendering.
3. Extend focused tests and scripted playtests so category mapping and dormant-to-active transitions remain regression-resistant.

## Open Questions

None for apply readiness. This proposal fixes the mechanic grouping ambiguity by assigning gravity capsule controls to route-toggle visuals and gravity capsule field interiors to gravity-modifier visuals.