## Context

This change crosses stage authoring, simulation, and Phaser presentation. The current stage set already supports terrain surfaces, gravity fields, checkpoint persistence, and bounded retro particles, but those mechanics are unevenly distributed: Verdant Impact Crater and Ember Rift Warrens do not yet author terrain-surface or gravity-field sections, Halo Spire Array carries the main gravity-field identity, and defeat transitions currently skip directly to hide or respawn behavior.

The implementation also needs to stay aligned with the existing retro presentation approach. The codebase already uses state-driven pose math, restrained tweens, and local particles in `retroPresentation.ts`; the change request explicitly prefers extending that system rather than introducing a separate spritesheet or AnimationManager pipeline.

## Goals / Non-Goals

**Goals:**
- Extend terrain-surface and gravity-field rollout across all three main stages with concrete, testable stage-authoring rules.
- Remove the Stage 3 checkpoint that appears after the exit door and lock in a spec rule that prevents similar checkpoint placement regressions.
- Add readable bounded enemy motion for grounded walkers and hoppers, separate sparkle accents for ovni or flyer enemies, and local defeat particles for enemies.
- Add a short player defeat blow-apart effect before respawn while preserving current damage, checkpoint, and respawn semantics.
- Keep the change apply-ready around the existing state-driven retro presentation path and current authoring and validation model.

**Non-Goals:**
- Introduce a full sprite-sheet art pipeline, Phaser AnimationManager dependency, or generalized animation state machine rewrite.
- Add new traversal mechanics beyond the already supported terrain surfaces, gravity fields, launchers, moving platforms, reveal routes, scanner bridges, and magnetic platforms.
- Change enemy attack cadence, stomp rules, damage math, checkpoint persistence semantics, or stage-complete flow.
- Rework stage order, stage themes, or unrelated menu and HUD surfaces.

## Decisions

- Keep presentation changes on the existing state-driven retro rendering path.
  - Rationale: the current code already supports bounded pose math and particles, and the request explicitly prefers extending that system.
  - Alternative considered: add spritesheet-driven animations per enemy and player state. Rejected because it widens scope, changes authoring needs, and conflicts with the requested bounded retro approach.
- Express “more imaginative stages” as authored mechanic-mix requirements instead of subjective art direction.
  - Rationale: implementation needs verifiable rules. Requiring each main stage to include both terrain-surface and gravity-field sections, plus a distinct route role for those sections, makes the request testable.
  - Alternative considered: keep the requirement qualitative and rely on manual review. Rejected because it would be ambiguous at verify time.
- Treat “foot enemies” as grounded walkers and hoppers only, and give flyers a separate hover-accent rule.
  - Rationale: the handoff explicitly narrows the ambiguity and prevents implementation from forcing gait states onto ovni or flyer enemies.
  - Alternative considered: use one animation contract for every enemy kind. Rejected because grounded and hovering enemies communicate motion differently.
- Model defeat feedback as short event-driven presentation overlays on top of existing gameplay resolution.
  - Rationale: enemy defeat and player death already have deterministic simulation outcomes. Adding a short local presentation beat preserves timing semantics while improving clarity.
  - Alternative considered: delay defeat resolution in simulation until long animation completion. Rejected because it risks changing encounter fairness and respawn feel.
- Enforce the stage rollout in validation and scripted playtest coverage.
  - Rationale: the authoring requirement spans data, runtime, and presentation. Validation plus scripted coverage is the cheapest way to keep future stage edits from silently removing terrain or gravity beats.
  - Alternative considered: rely only on static specs and manual playtest notes. Rejected because the change explicitly touches authored content and regression-prone placement rules.

## Risks / Trade-offs

- [Route crowding] Adding terrain and gravity beats to earlier stages could make the critical path busier than intended -> Require each stage's new section to serve a distinct route role and preserve readable recovery or alternate-line space.
- [Presentation overreach] Death particles and enemy accents could become noisy in mixed encounters -> Keep effects short-lived, local, palette-bounded, and tied to discrete defeat or hover-state events.
- [Semantic drift] A new defeat presentation could accidentally change stomp, damage, or respawn timing -> Keep simulation resolution authoritative and layer presentation on top of existing state transitions.
- [Validation gaps] New stage rules could be underspecified if only the spec text changes -> Back the rollout with stage-data validation and scripted playtest coverage across all three main stages.

## Migration Plan

1. Update the stage-authoring contract and tasks so every main stage must include at least one terrain-surface beat and one bounded gravity-field beat, and remove the invalid Stage 3 post-exit checkpoint.
2. Extend stage validation and scripted coverage to reject missing rollout pieces and after-exit checkpoints before runtime use.
3. Add grounded-enemy motion states, flyer sparkle accents, enemy defeat particles, and player defeat blow-apart presentation using the current retro presentation system.
4. Verify that respawn, checkpoint restore, enemy defeat resolution, and mixed-encounter readability remain unchanged apart from the new local feedback.

## Open Questions

- None for apply readiness. The handoff already resolves the main ambiguities around enemy scope, rollout direction, and presentation approach.