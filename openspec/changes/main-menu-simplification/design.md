## Context

The current `MenuScene` renders a title, a subtitle, an interactive option list, a bottom hint, a footer with focus/run metadata, and a rules overlay. The requested change is to reduce the default menu presentation so the player sees only the game name and the options by default, without losing the existing menu behaviors.

## Goals / Non-Goals

**Goals:**
- Present a minimal default menu layout with only the title and option controls visible.
- Remove persistent subtitle, footer, and run/meta text from the default menu view.
- Preserve existing menu actions for starting the game and adjusting menu settings.
- Update regression coverage so the simplified layout is verified directly.

**Non-Goals:**
- Redesign the menu into a different navigation model.
- Change how run settings are stored or applied.
- Remove the existing menu options or rules access entirely.
- Adjust gameplay, HUD, or stage content.

## Decisions

- Keep `src/phaser/scenes/MenuScene.ts` as the single source of truth for menu rendering and interaction. This is a presentation cleanup, not a new menu system.
  - Alternative considered: move the menu to HTML/CSS. Rejected because it would add unnecessary surface area and diverge from the existing Phaser scene pattern.
- Remove persistent subtitle/footer/meta text instead of compressing it into smaller helper copy.
  - Alternative considered: keep a compact footer with abbreviated state. Rejected because the requested outcome is a cleaner menu, not a smaller busy one.
- Preserve the interactive options list, including settings adjustments and the rules entry, so the player still has access to the existing controls.
  - Alternative considered: strip the menu down to `Start` only. Rejected because it would change behavior beyond the requested presentation cleanup.
- Update the playtest flow to assert the absence of removed chrome and the continued function of the remaining options.
  - Alternative considered: rely on screenshot-only validation. Rejected because the scene is stateful and the control behavior needs a deterministic regression check.

## Risks / Trade-offs

- [Discoverability] Removing footer and hint text reduces on-screen guidance -> Keep the option labels clear and preserve the rules entry so the menu still exposes controls.
- [Regression risk] Menu layout changes could break keyboard or pointer selection logic -> Update the playtest to exercise both interaction modes after the layout change.
- [Visual balance] A sparse menu can feel empty if spacing is not tuned -> Keep the existing decorative background treatment and center the option stack deliberately.

## Migration Plan

1. Update `MenuScene` to render the minimal default layout and keep option behavior intact.
2. Adjust `scripts/stage-playtest.mjs` to validate the new menu surface and continue checking navigation and start flow.
3. Run the build and playtest suite to confirm no regressions.
4. If needed, refine spacing or option placement based on the captured menu output before implementation is finalized.

## Open Questions

- Should the rules panel remain exactly as-is when opened, or should its copy also be trimmed later as a separate change?
- Is the menu background art considered part of the simplified layout, or should only text and UI chrome be removed?
