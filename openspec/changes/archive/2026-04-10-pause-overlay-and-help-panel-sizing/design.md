## Context

The existing pause capability assumes a layered menu flow with `Continue`, `Options`, and `Help`, plus submenu back-navigation. That model conflicts with the requested behavior, which is a simple obscured gameplay pause state with centered `PAUSE` text and no secondary actions while paused. Separately, the main-menu Help panel already supports overflow scrolling, but its current size leaves too much content below the fold.

## Goals / Non-Goals

**Goals:**
- Pause an active gameplay run with an obscured overlay that shows only centered `PAUSE` text.
- Let `ESC` pause and resume the exact same suspended run without recreating gameplay state.
- Remove pause-time access to `Continue`, `Options`, and `Help`.
- Increase the main-menu Help panel footprint so more text is visible before scrolling is necessary, while preserving overflow scrolling when content still does not fit.

**Non-Goals:**
- Redesign the main menu root options beyond keeping `Help` available there.
- Add new pause actions, settings controls, or help entry points during active pause.
- Change help content beyond what is necessary to support the larger panel and existing overflow behavior.
- Introduce save/load semantics or cross-session persistence for paused gameplay.

## Decisions

- Represent gameplay pause as a non-navigable overlay, not a menu scene with selectable actions.
  - Rationale: the confirmed requirements reduce pause to a suspend/resume affordance, so extra menu structure would be unnecessary and would preserve behavior the change is explicitly removing.
  - Alternative considered: keep the current pause menu and hide some actions. Rejected because it would leave behind the same layered interaction model the change is meant to replace.

- Use `ESC` as a strict toggle for active gameplay pause state.
  - Rationale: the user wants one control path that pauses on first press and resumes the exact suspended run on the next press.
  - Alternative considered: pause with `ESC` and resume with a different confirm action. Rejected because it adds an extra rule not present in the requirements.

- Keep Help accessible only from the main menu and enlarge that panel rather than splitting help into multiple pages.
  - Rationale: the change only preserves Help in the main menu, and a larger single panel reduces scrolling without introducing new navigation complexity.
  - Alternative considered: shorten the help copy instead of resizing the panel. Rejected because the requirement is about showing more content at once, not removing content.

- Preserve overflow scrolling and a visible scrollbar even after enlarging the Help panel.
  - Rationale: some screen sizes or future copy growth can still exceed the available panel height.
  - Alternative considered: disable scrolling once the panel is enlarged. Rejected because it would fail on smaller viewports and would make the contract brittle.

## Risks / Trade-offs

- [Held-key re-trigger] A single `ESC` press could be consumed by both pause and resume paths if input handling is not gated correctly. -> Mitigation: require apply to define one edge-triggered pause toggle path.
- [Overlay readability] Too little obscuring could leave the paused state visually noisy. -> Mitigation: require a clear obscured gameplay backdrop with centered `PAUSE` text as the only pause message.
- [Viewport variance] A larger Help panel can still overflow on small screens. -> Mitigation: keep overflow scrolling and visible scrollbar behavior in the contract.
- [Behavioral drift] Old pause submenu paths could remain reachable through stale bindings. -> Mitigation: explicitly remove pause-time `Continue`, `Options`, and `Help` expectations from the spec and regression coverage.

## Migration Plan

1. Replace the existing pause-menu contract with the overlay toggle behavior in the gameplay pause flow.
2. Remove pause-only submenu affordances and bindings that surface `Continue`, `Options`, or `Help` during gameplay pause.
3. Resize the main-menu Help panel while preserving overflow scrolling behavior for smaller viewports.
4. Update automated and playtest coverage to validate ESC pause/resume toggling and larger main-menu Help readability.

## Open Questions

No blocking design questions remain for apply. The implementation can choose the exact overlay opacity and Help panel dimensions as long as the visible behavior matches the updated requirements.