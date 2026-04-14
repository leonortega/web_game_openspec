## Context

An archived retro-presentation change established a shared Atari 2600-inspired helper for gameplay, HUD, and transition scenes while explicitly leaving the menu out of scope. The current menu still uses separate modern styling, and the existing retro pass still allows smoother decorative motion and a softer color treatment than this second pass intends. The implementation also overlaps with the active `main-menu-simplification` work in `MenuScene`, so this change must stay visual-only and avoid reopening menu-flow or gameplay-scope decisions.

## Goals / Non-Goals

**Goals:**
- Apply the shared retro presentation language to the main menu presentation surfaces.
- Tighten gameplay-facing visuals through harsher palette quantization and tighter sprite-like motion limits.
- Preserve readability for menu options, help content, HUD values, power states, hazards, and telegraphs.
- Keep simulation, gameplay cadence, scene flow timing, progression meaning, and authored content unchanged.
- Leave implementation work sequenced around the shared helper, scene surfaces, and playtest coverage.

**Non-Goals:**
- Redesign menu navigation, settings behavior, or help information architecture.
- Change physics, combat, enemy cadence, player powers, checkpoint logic, or progression rules.
- Re-author stages, routes, encounter layouts, or stage metadata.
- Introduce strict hardware emulation, analog-display overlays as a requirement, or a new asset pipeline.

## Decisions

- Keep `retroPresentation.ts` as the shared source of truth for the second-pass style contract.
  - Rationale: palette quantization rules and motion-limit rules need one bounded definition so menu, gameplay, HUD, and transition scenes do not drift.
  - Alternative considered: tune each scene independently. Rejected because it would make overlap management and archive-time spec verification harder.
- Treat the menu overlap as a presentation-layer integration, not a behavioral rewrite.
  - Rationale: `MenuScene` is already under active layout work, so this change must only restyle whichever root/help surfaces are current and must not reintroduce removed chrome or alter control behavior.
  - Alternative considered: wait for the active menu change to land first. Rejected because the presentation contract can still be made apply-ready now and the implementation can coordinate during apply.
- Implement tighter sprite-like motion limits only through render-side stepping, pose changes, and decorative-motion clamping.
  - Rationale: the handoff explicitly forbids gameplay changes, so any harsher motion treatment must leave simulation step timing, jump feel, enemy fire cadence, and transition durations intact.
  - Alternative considered: globally lowering update frequency or adding coarse simulation stepping. Rejected because it would change actual gameplay cadence.
- Preserve readability through reserved contrast, silhouette-first shapes, and explicit state accents instead of extra animation.
  - Rationale: harsher quantization removes room for subtle color or motion cues, so critical state changes must stay visible without smooth animation.
  - Alternative considered: compensate with more flicker or analog effects. Rejected because those effects are optional and can reduce clarity.
- Keep verification focused on visual-only outcomes and unchanged timing-sensitive behavior.
  - Rationale: the highest risk is accidentally coupling presentation tightening to gameplay or scene cadence, so coverage must assert the absence of those regressions.
  - Alternative considered: limit validation to screenshots. Rejected because cadence and interaction regressions need deterministic playtest checks.

## Risks / Trade-offs

- [Menu overlap] Active `main-menu-simplification` work touches the same scene surface -> Apply the retro treatment to whichever menu layout is current and avoid any behavior or content changes beyond presentation.
- [Readability regression] Harsher quantization can make options, powers, or hazards harder to parse -> Reserve accent contrast for interactable text and danger states, and require readable silhouette cues in each modified spec.
- [Timing leakage] Sprite-like motion limits can accidentally change perceived or actual cadence -> Restrict the change to render-side motion and explicitly forbid simulation-step, telegraph-timer, and scene-duration changes.
- [Scope creep] Presentation cleanup could expand into authored content or progression tweaks -> Keep requirements limited to menu presentation plus existing gameplay-facing retro surfaces and leave stage/progression files untouched.