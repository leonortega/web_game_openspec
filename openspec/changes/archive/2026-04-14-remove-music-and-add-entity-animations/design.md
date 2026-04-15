## Context

The current repo direction already uses asset-backed sustained music for menu and stage playback, but likely code touchpoints still include synthesized-loop metadata, validation assumptions, or audio-contract shapes that were useful before the music replacement pass. Those remnants need to be removed without regressing synthesized menu cues, gameplay SFX, or intro and completion stingers that current specs still depend on.

Visual presentation has the opposite problem: the game already has a strong authored stage and power vocabulary, but most gameplay actors are still rendered as static generated textures or simple geometry with only a few manual pulses and telegraphs. There is no established AnimationManager, TweenManager, or particle-emitter pattern in the current implementation, so the proposal needs to define a narrow, event-driven motion architecture instead of inviting scene-by-scene experimentation.

This change is cross-cutting because it touches shared audio contracts, player and enemy presentation, reward or checkpoint feedback, transition scenes, and automated validation. The design therefore needs explicit guardrails around timing, fairness, and readability so the implementation does not accidentally broaden into a full presentation rewrite.

## Goals / Non-Goals

**Goals:**
- Remove obsolete synthesized sustained-loop authoring surfaces while keeping the current asset-backed menu and stage mapping plus all required synthesized cues and stingers.
- Introduce a bounded retro animation system for player, enemy, and transition presentation that emphasizes readable low-frame poses rather than smooth modern motion.
- Add event-based particles and brief tween accents for jumps, checkpoints, coins, full-coin recovery, and power acquisition.
- Keep enemy telegraphs, controller timing, scene durations, and audio unlock or handoff semantics unchanged.
- Make validation concrete enough to prove both sustained-music cleanup and motion-feedback coverage.

**Non-Goals:**
- Reintroducing synthesized sustained menu or gameplay loops.
- Replacing existing synthesized SFX or transition stingers with recorded samples.
- Building a general animation editor, generalized FX graph, or ambient particle system.
- Changing stage layouts, enemy cadence, controller physics, or scene ordering as part of the visual pass.

## Decisions

- Remove sustained music authoring from synthesized-audio contracts entirely, leaving only asset-backed loop selection for menu and gameplay surfaces while synthesized cues and stingers remain in the existing synth path.
  - Rationale: the repo already committed to downloaded sustained music, so retaining no-op synthesized loop metadata would create ambiguity and fragile validation.
  - Alternative considered: keep the old synthesized loop shapes as dormant fallback metadata. Rejected because it would prolong the exact cleanup problem this change is supposed to resolve.

- Use a small shared animation-and-feedback layer instead of scene-local one-off motion code.
  - Rationale: player, enemies, transitions, and reward moments all need consistent bounded motion rules, so a shared registry for animation keys, tween presets, and particle presets gives implementation one place to encode those rules.
  - Alternative considered: let each scene or renderer own its own animation wiring. Rejected because it would make readability guardrails and regression coverage inconsistent.

- Reserve AnimationManager-style reusable animations for actors with repeatable state loops, and use short tweens for presentation accents or geometry-backed elements that do not justify frame-strip assets.
  - Rationale: the repo currently relies heavily on generated visuals, so forcing every animated element through frame sprites would add unnecessary asset churn. A mixed strategy fits the current codebase better while still creating explicit motion contracts.
  - Alternative considered: tween everything. Rejected because enemy or player state readability is better served by deterministic pose-based loops than by perpetual property interpolation.

- Keep particles strictly event-driven, short-lived, and low-count, with presets limited to jump dust or exhaust, checkpoint burst, coin spark, full-clear reward burst, and power-gain accent.
  - Rationale: these are the concrete moments the user asked to emphasize, and keeping the presets narrow avoids turning the stage into constant ambient noise.
  - Alternative considered: add trailing particles to player and enemies during all movement. Rejected because it would compete with hazard readability and clash with the repo's sparse retro direction.

- Tie enemy telegraph animation and transition animation to existing state timing rather than creating new timers.
  - Rationale: the change must remain readability-safe and event-based. Reusing current attack, intro, and completion state boundaries prevents accidental cadence drift.
  - Alternative considered: give animation its own independent timing model. Rejected because it risks desynchronizing telegraphs, scene handoffs, or celebration cues from the underlying game state.

- Extend validation at two levels: unit or integration checks for cleaned-up audio-contract ownership and deterministic view-model triggers, plus playtest coverage that confirms the requested feedback appears without changing timing.
  - Rationale: audio cleanup is structural, while readable animation and particles are experiential. Both need explicit validation rather than assuming manual review will catch regressions.
  - Alternative considered: rely only on manual visual inspection. Rejected because stale synth-loop config and missed event hooks are easy to miss without automation.

## Risks / Trade-offs

- [Risk] Mixing frame animation, tweens, and particles could create inconsistent motion language. → Mitigation: keep one shared registry of approved motion presets and use event names or actor states to route them.
- [Risk] Particle bursts could obscure hazards or route-critical footholds. → Mitigation: keep counts low, lifetimes short, and emitters anchored to local events instead of persistent follow effects.
- [Risk] Audio cleanup may accidentally remove synth cues that current scenes still rely on. → Mitigation: limit cleanup to sustained-loop authoring paths and validate cue and stinger behavior separately.
- [Risk] Enemy animation might accidentally imply timing changes that do not exist in simulation. → Mitigation: bind telegraph motion to existing deterministic state windows and forbid animation-owned timing.
- [Risk] Transition-surface polish could drift into timing or layout rework. → Mitigation: require intro and completion animation to fit inside current scene durations and existing handoff semantics.

## Migration Plan

1. Remove or collapse obsolete synthesized sustained-loop metadata, validation expectations, and audio-contract branches so menu and gameplay music resolve only through the current asset-backed mapping.
2. Add shared animation, tween, and particle preset plumbing plus the minimal state hooks needed for player, enemy, checkpoint, coin, and power feedback.
3. Apply the new feedback rules to transition scenes using existing intro and completion state timing.
4. Update automated tests and playtest coverage to prove asset-backed loop ownership, preserved synth cue or stinger behavior, and the new bounded event feedback.
5. If rollback is needed, keep the audio cleanup isolated from the motion layer so visual feedback can be reverted independently from sustained-music ownership changes.

## Open Questions

None. The requested scope is specific enough to leave the change apply-ready.