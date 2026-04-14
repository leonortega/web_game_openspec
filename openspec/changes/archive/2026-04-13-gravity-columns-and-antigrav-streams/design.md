## Context

The current game already supports low-gravity zones, launchers, sticky sludge, falling-platform escape timing, and checkpointed traversal state, but it does not support tighter airborne field variants that can redirect or sustain vertical motion in a bounded authored section. This change needs to touch stage content, controller resolution, scene presentation, checkpoint safety, and regression coverage while staying deliberately narrow: player-only rectangular fields, no generalized directional physics, and a primary rollout limited to the Halo Spire Array sky section.

## Goals / Non-Goals

**Goals:**
- Add two authored rectangular gravity-field variants: gravity inversion columns and anti-grav streams.
- Preserve the current impulse-first controller ordering for jump, double jump, dash, springs, bounce pods, gas vents, sticky sludge, and falling-platform escape timing.
- Keep dash as the bounded override that suppresses gravity-field acceleration while dash motion is active.
- Keep the mechanic readable, stage-authored, and centered on a single Halo Spire Array sky route instead of broadening it across the full game.
- Define validation and respawn behavior so field-driven sections remain deterministic across restarts and checkpoint recovery.

**Non-Goals:**
- Ceiling walking, upside-down grounded support, or inverted collision normals.
- Arbitrary vector gravity, magnetic traversal, orbit-style motion, or generalized directional physics.
- Enemy or projectile gravity changes.
- Multi-stage rollout beyond the initial Halo Spire Array sky section.
- Replacing launchers, low-gravity zones, or lifts with a new generalized movement framework.

## Decisions

- Represent both mechanics as authored axis-aligned rectangular field records with a `kind` discriminator rather than as generalized force vectors.
  - Rationale: the requested scope is two bounded field variants only, and rectangle-plus-kind authoring is easy to validate, render, serialize, and test.
  - Alternative considered: a freeform vector-field system. Rejected because it would broaden the mechanic far beyond the requested bounded scope.
- Resolve field effects only from the player's current airborne position and affect only ongoing vertical acceleration after impulse resolution.
  - Rationale: this preserves the current controller feel and honors the existing requirement that jumps, double jumps, springs, launchers, and sludge-modified jumps keep their authored impulse values.
  - Rule order:
    1. Support detection, jump buffering, coyote time, and launcher eligibility resolve using the current controller rules.
    2. Jump, double jump, spring, bounce pod, gas vent, dash, and sticky-sludge-modified jump impulses apply normally.
    3. If dash is currently overriding movement, gravity-field acceleration is suppressed for that update.
    4. Otherwise, the current field kind adjusts only the player's ongoing airborne vertical acceleration while the player remains inside its bounds.
    5. Leaving the field immediately restores normal gravity behavior.
  - Alternative considered: rewriting impulse magnitudes inside fields. Rejected because it would make controller interactions inconsistent and much harder to reason about.
- Define anti-grav streams and gravity inversion columns as distinct runtime behaviors.
  - Anti-grav streams provide continuous upward-biased airborne acceleration that slows or reverses falling while the player remains inside the stream.
  - Gravity inversion columns reverse ongoing airborne vertical acceleration while the player remains in the column, but they do not create grounded support or allow ceiling walking.
  - Rationale: the two mechanics need clearly separate authored uses and player expectations.
  - Alternative considered: treating both as different strengths of the same upward field. Rejected because it would blur the mechanic language and make inversion columns less readable.
- Keep gravity fields stateless and always-on rather than checkpoint-persistent traversal state.
  - Rationale: unlike reveal platforms or temporary bridges, these fields do not need discovery or timer state. Respawn behavior should depend only on authored geometry and current player position.
  - Alternative considered: checkpoint snapshots of per-field activation. Rejected because it adds unnecessary state and contradicts the requested bounded behavior.
- Add authoring validation that rejects zero-area or overlapping gravity fields, requires the supported field kinds, and keeps the initial field-authored route concentrated in the Halo Spire Array sky section.
  - Rationale: the mechanic is intended to stay readable and bounded; validation should prevent accidental content sprawl or ambiguous overlapping field behavior.
  - Alternative considered: allowing overlaps and resolving them by priority. Rejected because overlap rules would add complexity without a clear design need.
- Keep checkpoint placement outside active gravity-field motion and validate respawn safety for nearby sections.
  - Rationale: checkpoints should not spawn the player directly into forced airborne motion, especially because upside-down grounded support is explicitly out of scope.
  - Alternative considered: allowing checkpoints inside fields and relying on implementation tuning. Rejected because it creates avoidable respawn ambiguity.

## Risks / Trade-offs

- [Tuning risk] Field acceleration that is too strong or too weak can trivialize or stall airborne traversal. -> Mitigation: keep strength choices bounded per field kind and verify the Halo Spire Array route with targeted playtest coverage during apply.
- [Ordering risk] Controller regressions can appear if fields are applied before impulses or while dash override is active. -> Mitigation: add unit coverage for jump, double jump, sludge jump, launcher contact, dash, and falling-platform escape inside each field type.
- [Authoring risk] Overused fields would turn a bounded stage mechanic into a systemic gravity rewrite. -> Mitigation: validate the initial rollout to the Halo Spire Array sky section and keep the spec language stage-authored rather than global.
- [Respawn risk] Unsafe checkpoint placement near fields could spawn the player into unreadable motion. -> Mitigation: codify safe checkpoint footing requirements and cover respawn behavior in scripted playtests.

## Migration Plan

1. Extend stage content definitions and validation for rectangular gravity-field records and supported field kinds.
2. Update simulation and controller resolution so field acceleration applies after impulses and remains suppressed by dash override.
3. Add Halo Spire Array sky-section authored content and scene presentation for the new fields without broadening rollout to additional stages.
4. Add unit and scripted playtest coverage for controller ordering, field readability, checkpoint safety, and restart or respawn behavior.

## Open Questions

No apply blocker remains. Exact tuning values and the final Halo Spire Array placements can be set during apply as long as they preserve the spec-level ordering, checkpoint safety, and bounded rollout constraints.