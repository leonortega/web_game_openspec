## Context

The current game shell centers a 16:9 play surface capped around a 1080 px desktop width while Phaser renders internally at 960x540 with FIT scaling. That keeps the game stable across screens, but on larger displays it leaves a relatively small visible play surface. The stage intro and completion scenes also still spend part of their limited layout budget on a decorative astronaut accent sprite that is not required for status readability or flow comprehension.

This change is presentation-only. It must not alter gameplay resolution, scene ordering, timing semantics, fiction labels, or stage logic. The implementation will likely touch both DOM shell sizing and Phaser scene composition, so the proposal benefits from explicit design decisions before apply work starts.

## Goals / Non-Goals

**Goals:**
- Increase the apparent game size substantially on larger desktop viewports without changing the internal 960x540 gameplay resolution.
- Keep the shell responsive and centered so smaller screens still fit cleanly without overflow or clipped UI.
- Remove decorative astronaut figures from the stage intro and completion scenes while preserving transition readability, timing, and existing retro presentation constraints.
- Leave clear validation targets for test, build, and stage-flow playtesting.

**Non-Goals:**
- Reworking gameplay camera scale, controller timing, or authored stage dimensions.
- Renaming astronaut-themed copy, powers, or collectible terminology.
- Redesigning the full transition-scene art direction beyond removing the astronaut accent figure and rebalancing layout around the remaining content.
- Introducing a new responsive scaling mode or a second gameplay resolution.

## Decisions

### Keep Phaser's internal game resolution unchanged and enlarge the presentation at the shell layer
The change will preserve the current internal 960x540 render size and existing Phaser FIT-based scaling semantics. Enlarging the shell by adjusting the containing layout and desktop width bounds is lower risk than changing the game resolution or camera math, because it avoids ripple effects across gameplay, hit feel, authored spacing, and existing tests.

Alternative considered: increase the Phaser base resolution or swap scaling modes. This was rejected because it would widen scope from presentation into gameplay-facing rendering behavior and create unnecessary regression risk.

### Treat responsive shell sizing as a bounded desktop enhancement, not an unbounded full-bleed layout
The shell should grow materially on roomy viewports, roughly up to double the current apparent size where the browser allows, but remain bounded by viewport-aware clamps so it still fits on smaller laptops and mobile screens. This keeps the request focused on making the game more prominent rather than redesigning the page into a fullscreen app shell.

Alternative considered: make the canvas always fill the browser viewport. This was rejected because it would likely break current menu and HUD framing expectations and produce avoidable mobile or short-viewport issues.

### Remove transition astronaut accents by simplifying scene composition rather than replacing them with a new character element
The stage intro and completion scenes should keep their status text, backdrop, and any bounded non-character accents that already support readability, but they should no longer reserve space for a decorative astronaut figure. The layout should be rebalanced around typography and existing transition-state accents instead of swapping in a different hero illustration.

Alternative considered: replace the astronaut sprite with another decorative prop or stage icon. This was rejected because the request is specifically about removing the current figure and keeping scope narrow.

### Validate with existing automated checks plus stage-flow playtesting
The apply phase should prove the change with `npm test`, `npm run build`, and a stage transition playtest if the scripted playtest remains available. Those checks cover regression risk across CSS shell behavior, scene compilation, and transition flow.

## Risks / Trade-offs

- Larger desktop shell may make low-resolution art appear softer or expose layout gaps more clearly. → Mitigation: keep the internal resolution and scaling pipeline unchanged, and use bounded shell growth rather than unlimited stretch.
- Removing the astronaut accent may leave transition scenes feeling visually sparse. → Mitigation: rebalance spacing and existing backdrop or accent elements so status text remains the primary focus without adding a new decorative character.
- Responsive shell changes can regress small-screen fit. → Mitigation: express sizing through viewport-aware CSS clamps and verify on constrained layouts during playtesting.
- The likely implementation spans both CSS and Phaser scene layout code. → Mitigation: keep the spec and task list explicit about preserving timing, flow, and copy so apply work stays narrow.

## Migration Plan

No data or content migration is required. Apply can ship as a presentation update, and rollback is a straightforward code revert of shell sizing and transition-scene layout changes if regressions appear.

## Open Questions

None. The request is specific enough to proceed directly into apply with bounded presentation-only changes.