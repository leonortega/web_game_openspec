## Context

Stage definitions already provide palette inputs such as `skyTop`, `skyBottom`, `ground`, and `accent`, but the current retro backdrop helper does not fully honor that authored separation. It still hardcodes broad background bands and reuses colors that also appear on default platforms and other gameplay-facing surfaces, which can make the backdrop read like traversable space. The likely implementation path touches the shared retro presentation helper plus the gameplay scene entry points that choose or pass stage palette data.

## Goals / Non-Goals

**Goals:**
- Derive active-stage backdrop colors from authored stage palette inputs instead of relying on the current hardcoded background band mix.
- Preserve a clear visual split between background scenery and playable surfaces, especially platforms, hazards, player powers, and HUD text.
- Keep any added separation effect subtle, backdrop-only, and optional in practice rather than introducing a heavy analog-display treatment.
- Centralize the palette-separation logic so gameplay scenes and transition scenes stay consistent without duplicating color rules.

**Non-Goals:**
- Redesign the main menu or other non-stage screens.
- Rework terrain generation, gameplay rules, enemy behavior, or player-power mechanics.
- Add strong CRT, blur, or distortion treatments that become part of gameplay communication.

## Decisions

- Resolve a dedicated backdrop palette from the authored stage colors before rendering decorative bands or columns.
  - Rationale: the root problem is color-role ambiguity, so the helper needs an explicit background lane rather than reusing foreground-facing panel colors.
  - Alternative considered: keep the current helper and only tweak hardcoded constants. Rejected because the same blending problem will recur as stages vary.
- Keep backdrop separation logic inside the shared retro presentation layer, with scenes only responsible for supplying stage palette context.
  - Rationale: gameplay, intro, and completion views should not each invent their own background/foreground split.
  - Alternative considered: hand-tune each scene independently. Rejected because it would fragment behavior and make regressions more likely.
- Prefer contrast-preserving background adjustments over heavy post-processing.
  - Rationale: slight shifts in band colors, column colors, or backdrop-only texture treatment can separate scenery from play space without compromising readability.
  - Alternative considered: stronger scanlines, blur, or analog artifacts. Rejected because the explore handoff explicitly calls out readability and subtlety risks.
- Verify the change against stages where the current backdrop can visually merge with platforms or props.
  - Rationale: the failure mode is palette-specific, so implementation should prove separation on representative authored palettes instead of only one default scene.
  - Alternative considered: rely on manual spot checks alone. Rejected because the regression risk is primarily visual and stage-dependent.

## Risks / Trade-offs

- [Risk] Stronger backdrop contrast could drift away from the current retro mood. → Mitigation: keep the change limited to background-role separation and avoid adding new decorative complexity.
- [Risk] Scene-specific palette plumbing may expose inconsistencies between gameplay and transition views. → Mitigation: use one shared backdrop palette resolution path and validate all scenes that consume it.
- [Risk] Some stage palettes may have too little spread between authored colors to guarantee separation with direct reuse alone. → Mitigation: allow bounded background-only offsets or derived tones while preserving the authored palette intent.