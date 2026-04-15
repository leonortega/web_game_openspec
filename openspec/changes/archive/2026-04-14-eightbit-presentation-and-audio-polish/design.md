## Context

The current live specs already establish a retro presentation direction, asset-backed sustained music, browser-audio unlock behavior, and selective motion-audio gating. The approved explore handoff narrows the next change to three concrete problems inside that existing direction: gameplay visuals still read as an overly coarse early pass instead of a denser readable 8-bit presentation, the menu's intended title music can fail to become audibly active in runtime, and enemies can enter the visible play space without timely audible cues.

This work is cross-cutting because it touches shared gameplay rendering language, player and enemy presentation, menu-scene music ownership, and threat-audio timing. It must also coordinate with archived retro-presentation and audio changes while explicitly avoiding scope creep into the active `main-menu-simplification` and `stage-layout-safety-and-turret-telegraph` changes. The current `phaser-4-runtime-compatibility` spec also means any implementation path must preserve existing scene flow, asset-backed music mapping, audio unlock behavior, and gameplay cue coverage under the current engine constraints.

## Goals / Non-Goals

**Goals:**
- Define a denser 8-bit gameplay look for the player, enemies, terrain, and stage backdrop that remains readable at the current gameplay scale.
- Preserve foreground versus background separation and threat telegraph clarity while increasing pixel complexity.
- Treat audible menu music after browser unlock as required runtime behavior of the existing menu capability rather than a new feature.
- Make enemy motion or presence cues begin when threats become visible or otherwise immediately view-relevant, without introducing off-screen audio spam.
- Preserve the existing turret lead-margin exception unless implementation proves a cleaner equivalent that still keeps the same fairness semantics.
- Keep the change compatible with the current Phaser 4 runtime contract, existing stage content, and current scene timing.

**Non-Goals:**
- Reopening menu layout simplification, stage-layout safety, or turret encounter authoring.
- Replacing the current asset-backed sustained music selections with new tracks.
- Adding fully bespoke art assets for every stage object or introducing a full sprite-sheet production pipeline.
- Changing gameplay behavior, enemy cadence, projectile timing, collision, or stage routing.
- Making off-screen enemies globally audible before they are relevant to the visible play space.

## Decisions

- Use the existing generated or code-driven visual pipeline as the foundation and increase pixel complexity through bounded internal detail, accent clusters, tile-edge variation, and backdrop motif layering rather than a broad art-pipeline rewrite.
  - Alternative considered: replace the current presentation with a large new sprite-sheet asset set. Rejected because the request is a polish pass, not a content-production reset, and the repo already supports code-driven retro rendering.

- Shift gameplay-facing presentation from the earlier coarse Atari-like pass toward a denser NES-like 8-bit readability target, but keep silhouette-first contrast, limited palette discipline, and subdued backdrop separation as hard guardrails.
  - Alternative considered: keep the current coarse silhouette-only style and only tweak colors. Rejected because the user explicitly asked for more pixel complexity across player, enemies, terrain, and background, not only recoloring.

- Express the player and enemy visual changes as readability constraints instead of exact art prescriptions: added detail must reinforce silhouettes, power accents, telegraph states, projectile visibility, and terrain edges rather than compete with them.
  - Alternative considered: specify exact sprite detail counts or animation frames. Rejected because the spec should lock behavior and readability outcomes, not overfit one implementation.

- Treat the menu music issue as scene-audio ownership and unlock-state correctness within the existing title-track contract. Once the browser unlocks audio and the menu owns sustained music, the mapped menu track must become audibly active without requiring scene re-entry or unrelated user flow.
  - Alternative considered: introduce a second explicit menu-music trigger path or a new menu-only audio capability. Rejected because the intended capability already exists; the problem is runtime reliability.

- Gate enemy audibility by view relevance: cues may begin when a threat becomes visible in the active camera or enters an already-supported lead-margin used to warn of imminent in-view turret behavior, and otherwise remain selective and cooldown-safe.
  - Alternative considered: play enemy movement or attack audio whenever the enemy simulates, even while off-screen. Rejected because it would reduce fairness, create audio clutter, and conflict with the existing visibility-driven turret behavior.

- Keep validation split across deterministic ownership checks and perceptual playtest checks. Deterministic checks prove menu music ownership and viewport-gated threat cues; playtest validation proves the denser 8-bit pass still preserves route readability and foreground/background separation.
  - Alternative considered: rely only on visual inspection after implementation. Rejected because the repo already uses OpenSpec and playtest evidence to keep cross-cutting presentation changes stable.

## Risks / Trade-offs

- [Readability regression] More pixel detail could blur the player, hazards, or route edges at gameplay scale -> Mitigation: require silhouette-first contrast, reserved accents for power or danger states, and secondary backdrop treatment.
- [Audio clutter] Making enemy cues audible earlier could create repetitive noise in busy encounters -> Mitigation: tie cues to viewport entry, state changes, cadence windows, or cooldowns instead of continuous motion.
- [Scope creep] Presentation changes can spread into HUD, menu layout, or encounter retuning -> Mitigation: keep this change limited to gameplay-facing visual detail, menu music runtime correctness, and enemy audibility timing.
- [Runtime drift] Fixing menu music could accidentally disturb current scene handoffs or unlock behavior -> Mitigation: preserve existing asset mappings, scene ownership semantics, and Phaser 4 runtime-compatibility expectations.

## Migration Plan

1. Update the OpenSpec contracts for gameplay presentation, player visuals, enemy readability, menu music ownership, and viewport-aware enemy audibility.
2. Rework gameplay-facing render helpers and presentation mappings to add bounded 8-bit pixel detail without changing gameplay data or timing.
3. Correct menu-scene sustained-music startup and handoff behavior within the existing asset-backed audio path.
4. Add or refine viewport-aware enemy cue triggering so visible or lead-margin-relevant threats become audible without off-screen spam.
5. Validate the change with focused automated coverage plus playtest evidence for readability, menu audio unlock, and threat audibility.

## Open Questions

- None blocking apply readiness. This change assumes the current asset-backed sustained music direction and the existing turret lead-margin exception remain the intended repository baseline.