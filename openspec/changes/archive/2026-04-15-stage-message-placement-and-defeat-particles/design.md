## Context

This change is a cross-cutting refinement rather than a new feature surface. The current gameplay HUD already divides persistent information from transient message copy, but the transient stage-message renderer still uses a top-center placement that competes with the top scoreboard and becomes less comfortable on narrow or mobile-sized viewports. At the same time, the retro presentation path already supports bounded defeat particles, but enemy defeats still resolve through a generic effect even when the underlying cause differs materially between a stomp and a Plasma Blaster projectile hit.

The implementation spans DOM HUD layout, simulation-owned event classification, and Phaser presentation wiring. It needs to stay within the existing state-driven HUD and retro-presentation architecture instead of introducing a new overlay scene, separate particle framework, or animation-manager path.

## Goals / Non-Goals

**Goals:**
- Move transient stage and gameplay event messages into a lower-left active-play safe area that remains readable alongside the top HUD band.
- Keep objective briefings and incomplete-exit reminders on the existing transient stage-message flow while making that flow mobile-safe and positionally consistent.
- Distinguish stomp enemy defeats from Plasma Blaster projectile enemy defeats through separate bounded particle variants.
- Preserve the existing player-death burst while keeping it visually distinct from enemy-defeat feedback.
- Keep simulation timing authoritative so defeat resolution, damage rules, and respawn cadence do not drift.

**Non-Goals:**
- Redesign the persistent top HUD band, add a new mission panel, or move core status out of its current scoreboard treatment.
- Add new combat mechanics, new enemy states, or new player powers.
- Introduce spritesheet animation pipelines, persistent particle ambience, or a separate overlay scene just for messages.
- Change stomp rules, projectile damage rules, checkpoint semantics, or stage-complete flow.

## Decisions

- Treat transient stage and gameplay messages as a dedicated lower-left HUD lane rather than part of the top scoreboard band.
  - Rationale: the top band already owns persistent status. A lower-left lane separates temporary copy from persistent HUD data and resolves the top-center collision without changing the scoreboard contract.
  - Alternative considered: keep the messages near the top and only offset them slightly below the HUD. Rejected because it preserves the same visual crowding and does not solve narrow-viewport contention.
- Define the new message placement in terms of a lower-left safe area with bounded viewport insets instead of fixed desktop coordinates.
  - Rationale: the handoff explicitly calls for lower-left safe-area behavior and mobile safety. Safe-area wording lets implementation adapt margins responsively without changing the spec for each viewport size.
  - Alternative considered: specify a fixed pixel anchor from the bottom-left corner. Rejected because it would be brittle across display sizes and scale modes.
- Keep defeat-cause classification in simulation and map it to presentation variants downstream.
  - Rationale: `GameSession` already owns whether an enemy died to a stomp or a player projectile. Letting simulation emit a bounded defeat cause keeps presentation deterministic and avoids inferring cause from visuals after the fact.
  - Alternative considered: infer the effect variant entirely inside the Phaser layer based on nearby entities. Rejected because it is more error-prone and can drift from authoritative gameplay outcomes.
- Reuse the existing retro-presentation particle path and add narrowly scoped variants for stomp, Plasma Blaster projectile, and player death.
  - Rationale: the existing presentation system already carries local bounded effects. Adding variant selection is lower risk than adding new emitter infrastructure.
  - Alternative considered: create a generic configurable particle system for all defeat and message events. Rejected because it broadens scope beyond the requested refinement.
- Keep stage-progression copy sources unchanged and only relocate where the transient flow renders during active play.
  - Rationale: objective briefings and reminders already use the correct event flow. This change is about placement consistency, not about inventing a new message source or persistence model.
  - Alternative considered: split objective reminders into a separate HUD element. Rejected because it would duplicate information architecture and contradict the existing transient-message contract.

## Risks / Trade-offs

- [Lower-left copy may still compete with gameplay on cramped screens] -> Keep the message lane inset from the viewport edges, short-lived, and separate from any persistent HUD block so it reads as a brief cue rather than a large overlay.
- [Defeat-cause mapping could drift from real gameplay outcomes] -> Keep the defeat cause authoritative in simulation and pass only a small explicit cause enum or equivalent event payload to presentation.
- [New particle variants could become noisier than the current generic burst] -> Keep each variant palette-bounded, local to the defeat point, and similar in lifetime so differentiation comes from shape and spread rather than spectacle.
- [Objective reminders could become inconsistent if some call sites bypass the shared message lane] -> Audit the transient stage-message entry points during implementation and route them all through the same placement contract.

## Migration Plan

1. Update the transient active-play HUD contract so gameplay and stage messages render in the lower-left safe area on all supported viewport sizes.
2. Thread an explicit defeat-cause signal through the existing simulation-to-presentation handoff for stomp kills, Plasma Blaster projectile kills, and player death.
3. Extend the retro presentation layer with bounded effect variants for those defeat causes while preserving current timing and cleanup behavior.
4. Add or update layout and presentation coverage so the message lane and defeat variants remain stable across later HUD or effects changes.

## Open Questions

None for apply readiness. The explore handoff already resolves the key ambiguity by treating the requested "blaster" feedback as the Plasma Blaster projectile kill path and the requested placement as the lower-left HUD safe area.