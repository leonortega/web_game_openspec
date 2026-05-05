## Context

The current stage-authoring model supports spring platforms, low-gravity zones, and sticky sludge, but it does not provide biome-specific launchers that stay bounded to contact surfaces while remaining distinct from springs. This change needs explicit pre-implementation decisions because it touches stage data, simulation, controller interaction rules, stage validation, tests, and player-facing presentation in one traversal feature.

## Goals / Non-Goals

**Goals:**
- Introduce bounce pods and gas vents as authored launcher kinds that stay separate from spring platforms in data, simulation, and presentation.
- Keep launcher behavior bounded to contact-triggered impulses instead of continuous lift or gravity-field behavior.
- Preserve the existing impulse-first controller contract, especially for low gravity, sticky sludge, dash, buffered jump, and coyote time.
- Give authors a small upward-biased directional range without turning launchers into arbitrary vector cannons.
- Require validation, automated coverage, and playtest coverage so launcher content stays reliable.

**Non-Goals:**
- Replace or retune existing spring platforms.
- Add continuous lift columns, anti-grav streams, gravity zones, or jetpack-like traversal.
- Add a new interact button or manual activation flow for launchers.
- Rework checkpoint, HUD, or menu systems beyond launcher reset and validation needs.

## Decisions

- Use two launcher archetypes with one shared contact-launch contract.
  - Decision: `bouncePod` and `gasVent` will both be launcher-specific authored kinds that trigger from eligible top-surface contact while ready, apply one launch impulse, and then enter cooldown. They will not reuse the spring kind or low-gravity metadata.
  - Rationale: this keeps the mechanic distinct from springs in authored data and runtime behavior while preserving a common mental model for contact launchers.
  - Alternative considered: skin springs differently per biome. Rejected because it would hide materially different traversal rules behind the same authored type.

- Differentiate bounce pods and gas vents through impulse and readiness rather than activation shape.
  - Decision: bounce pods launch higher and recover sooner, while gas vents launch lower and recover more slowly under otherwise identical conditions. Both remain single-contact launchers, and neither becomes a continuous lift source.
  - Rationale: this produces a readable biome distinction without adding a second interaction model.
  - Alternative considered: make gas vents continuous upward push zones. Rejected because the handoff explicitly bounds the change to contact launchers, not lift fields.

- Allow a small authored directional range, clamped to upward-biased motion.
  - Decision: both launcher kinds may define an optional launch direction up to 25 degrees off vertical, with no downward or horizontal-only vectors.
  - Rationale: this gives stage authors enough control to shape route lines and collectible detours without creating hard-to-read sideways cannons.
  - Alternative considered: vertical-only launchers. Rejected because it limits stage-authoring value and makes gas vents feel too similar to biome-skinned springs.

- Trigger only on the first eligible ready-contact update and preserve spring-style suppression.
  - Decision: a launcher fires on the first update where the player gains eligible top-surface contact while the launcher is ready. Holding jump on that update, or resolving a buffered jump on that update, suppresses the auto-launch for that contact. Suppression does not spend cooldown, and the launcher will not retroactively fire later during the same uninterrupted contact.
  - Rationale: this matches current spring expectations, preserves player intent, and avoids surprise delayed launches after landing.
  - Alternative considered: allow launch after jump release while standing on the launcher. Rejected because it changes the interaction into a latent trigger and makes contact timing harder to reason about.

- Keep composition rules impulse-first and non-interruptive.
  - Decision: launcher impulse applies first, then low gravity modifies the airborne arc afterward. Sticky sludge does not damp launcher impulses. Active dash is not interrupted by launcher contact, and launcher contact during dash does not create a deferred retroactive launch. Standard landing-state resets may still occur on the landing frame, but launchers add no extra reset behavior of their own.
  - Rationale: this stays aligned with the existing controller contract and prevents special-case ordering bugs.
  - Alternative considered: let launchers override dash or low gravity directly. Rejected because it would break the established movement-priority rules.

- Treat launcher readiness as transient traversal state with validation-backed authoring.
  - Decision: launcher metadata must use dedicated supported kinds, aligned bounded footprints, and non-overlapping first-contact areas. Fresh attempts and checkpoint respawns reset launchers to ready rather than preserving mid-cooldown state. Regression coverage must include both launcher kinds, suppression/cooldown behavior, and at least one low-gravity or sticky-sludge composition route.
  - Rationale: launcher state is short-lived traversal timing, not persistent route discovery, and validation keeps authored data deterministic.
  - Alternative considered: persist cooldown state through respawn. Rejected because it complicates recovery and adds little gameplay value for a contact launcher.

## Risks / Trade-offs

- [Risk] Launcher rules could drift too close to springs if the impulse and recovery gap is too small. -> Mitigation: require bounce pods to launch higher and recover sooner than gas vents, with distinct authored kinds and presentation.
- [Risk] Directional launcher authoring could become unreadable if it allows strong lateral throws. -> Mitigation: clamp authored direction to 25 degrees off vertical and validate invalid vectors before runtime.
- [Risk] Jump buffering and dash interactions could produce accidental double-resolution bugs. -> Mitigation: define first-contact priority explicitly and cover suppression, dash contact, and cooldown reuse in automated tests.
- [Risk] New validation may invalidate provisional stage layouts. -> Mitigation: keep validation targeted to supported kinds, aligned footprints, and ambiguous-overlap cases only.