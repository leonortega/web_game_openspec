## Context

The current game supports authored stage geometry, moving and unstable platform behaviors, checkpoints, and player movement powers, but it does not have a way to author localized gravity changes or discovery-based support routes that persist correctly through respawns. This change spans stage content, runtime simulation state, scene rendering, and regression tooling, so the implementation needs explicit decisions around data shape, interaction order, and checkpoint persistence.

## Goals / Non-Goals

**Goals:**
- Add authored rectangular low-gravity zones that affect only the player.
- Add reveal platforms that start hidden and non-solid, reveal from nearby proximity volumes, and become part of the traversable route once discovered.
- Define deterministic interaction order between low gravity and the existing jump, double jump, dash, spring, and falling-platform escape rules.
- Preserve reveal state across respawns only when a checkpoint was activated after the reveal.
- Cover the new authoring and runtime behavior with tests and playtest assertions.

**Non-Goals:**
- Add gravity flip, directional gravity, orbital motion, or enemy-wide gravity changes.
- Add timer-driven on/off platforms, scanner-triggered reveals, or presentation-only fake platforms.
- Redesign the player controller, checkpoint system, or menu flow beyond the requirements needed for these two mechanics.

## Decisions

- Represent low-gravity zones as authored axis-aligned rectangles in stage content and evaluate them inside simulation from the player's world position.
  - Rationale: the explore handoff explicitly scopes the mechanic to rectangular stage sections, and a rectangular data model is easy to author, validate, serialize, and test.
  - Alternative considered: spline or polygon gravity volumes. Rejected because they add authoring complexity without a stated need.
- Apply low gravity by scaling only the player's ongoing vertical acceleration while inside a zone, not by changing input rules or rewriting launch impulses.
  - Rationale: this keeps the mechanic readable and preserves the existing controller feel while still extending airtime.
  - Rule order:
    1. Support detection, jump buffering, and coyote timing resolve using the current controller state before gravity scaling.
    2. Jump, double jump, and spring launch events apply their normal authored impulse immediately when triggered.
    3. While the player remains inside a low-gravity zone, subsequent per-frame vertical acceleration is reduced, which stretches ascent and descent after those impulses.
    4. Dash keeps its existing dash motion and override behavior while the dash is active; low gravity resumes affecting vertical acceleration once dash control yields back to normal airborne motion.
    5. Falling-platform support remains valid under the current support rules, and an escape jump from that support starts with the normal jump impulse before low gravity changes the rest of the arc.
  - Alternative considered: lower every jump-like impulse inside the zone. Rejected because it would make springs, double jump, and dash feel inconsistent with the current move set.
- Model reveal platforms as authored pairs of a hidden platform volume and a linked reveal trigger volume with a stable authored identifier.
  - Rationale: the platform and its reveal trigger need a durable identity so attempt state and checkpoint snapshots can persist the reveal deterministically.
  - Alternative considered: infer reveal identity from array position or world coordinates. Rejected because authoring edits could destabilize persistence and tests.
- Store reveal state in attempt-scoped simulation state and snapshot the revealed identifiers into checkpoint state at checkpoint activation time.
  - Rationale: this matches the requested rule exactly: a reveal persists after checkpoint activation only if the checkpoint was reached after the reveal occurred.
  - Alternative considered: always preserve revealed platforms once discovered in a stage. Rejected because it would ignore the requested reset behavior for earlier checkpoint states.
- Keep collision authority in simulation state and let the Phaser scene render hidden versus revealed platforms from that state.
  - Rationale: reveal-solid behavior affects gameplay correctness, so the simulation must remain the source of truth and the scene should only mirror it visually.
  - Alternative considered: make reveal platforms visual-only in the scene until a later sync step. Rejected because it risks view/simulation divergence.
- Add stage-authoring validation for reveal-platform IDs and linked reveal volumes, and add regression coverage for low-gravity arcs and checkpoint persistence.
  - Rationale: both mechanics depend on authored data integrity, and they affect failure-prone state transitions that should be covered before implementation lands.
  - Alternative considered: rely on manual stage testing only. Rejected because persistence edge cases are easy to miss without deterministic tests.

## Risks / Trade-offs

- [Tuning risk] Low gravity that is too weak or too strong could trivialize jump timing or make sections feel sluggish. -> Mitigation: keep the spec focused on interaction order and tune the multiplier through tests and authored stage probes during apply.
- [State risk] Reveal-platform persistence can regress if checkpoint snapshots miss or over-capture revealed IDs. -> Mitigation: add targeted serialization and respawn tests for both reveal-before-checkpoint and checkpoint-before-reveal cases.
- [Authoring risk] Linked reveal volumes and platforms can drift out of sync if IDs are duplicated or omitted. -> Mitigation: validate authored IDs and fail fast in stage-content tests.
- [Readability risk] A hidden platform that reveals too late can feel unfair. -> Mitigation: require reveal from a nearby volume and validate the intended discovery path in playtest coverage.

## Migration Plan

1. Extend stage content definitions and validation for low-gravity zones, reveal platforms, and linked reveal volumes.
2. Update simulation state and `GameSession` logic so low-gravity and reveal persistence are resolved in gameplay state rather than scene-only code.
3. Mirror the resulting platform visibility and solidity in `GameScene` and add authored stage fixtures that exercise both mechanics.
4. Add unit tests and stage playtest coverage for interaction order and checkpoint persistence before implementation is considered complete.

## Open Questions

- No artifact blocker remains. Gravity strength, reveal-volume sizing, and exact stage placements can be tuned during apply as long as they stay within the requirement contract.