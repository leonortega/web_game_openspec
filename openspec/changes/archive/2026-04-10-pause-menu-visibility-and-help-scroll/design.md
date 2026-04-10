## Context

The current pause flow already uses `ESC` during gameplay, but the first key press can both open and immediately dismiss the pause root, leaving the run paused without a stable visible menu. The shared `Help` surface is also long enough that lower sections can extend beyond the visible menu viewport, yet the menu contract does not currently define how overflow content should scroll or how the player discovers that more content exists.

This change stays inside the existing shared menu surface used by the main menu and pause menu. It needs explicit behavior for pause entry, layered `ESC` handling, and shared help scrolling so apply can implement one consistent interaction model instead of menu-specific exceptions.

## Goals / Non-Goals

**Goals:**
- Keep the pause root visible when `ESC` first pauses an active run.
- Define one shared help-surface scrolling model for both main-menu and pause-menu entry points.
- Require a visible scrollbar whenever help content exceeds the viewport.
- Make keyboard and pointer or wheel affordances explicit enough to guide implementation and regression coverage.

**Non-Goals:**
- Rewrite the menu flow into separate main and pause UI systems.
- Change help copy beyond what is necessary to preserve the existing shared content.
- Redesign options behavior, HUD behavior, or unrelated main-menu layout decisions.
- Add touch-specific gestures or gamepad-only navigation rules in this change.

## Decisions

- Treat the initial gameplay `ESC` press as pause-entry only, not as both pause-entry and an immediate back action.
  - Rationale: the player needs a stable visible pause root before any resume or back semantics can apply.
  - Alternative considered: debounce `ESC` globally for a short time after opening pause. Rejected because it hides the intended state model behind timing behavior that is harder to test.

- Keep the shared `Help` surface as a single reusable menu panel for both menu contexts.
  - Rationale: shared content and shared scrolling behavior should stay in one implementation path so pause and main menu do not drift.
  - Alternative considered: create a pause-only help panel with its own overflow rules. Rejected because it duplicates the same content contract and creates avoidable divergence.

- Make help scrolling conditional on overflow and surface it with a visible scrollbar.
  - Rationale: the scrollbar communicates that more content exists, while overflow-gated scrolling avoids adding inert UI when the content already fits.
  - Alternative considered: paginate the help copy into multiple screens. Rejected because it adds navigation complexity to a reference panel that should stay quickly readable.

- Support both keyboard and pointer or wheel scrolling on the shared help panel.
  - Rationale: both menu entry points already rely on mixed input methods, and the spec needs explicit affordances so tests can assert actual behavior rather than assuming browser-like defaults.
  - Alternative considered: keyboard-only scrolling. Rejected because it would make pointer users rely on indirect focus movement and would be inconsistent with the existing pointer-accessible menu surface.

## Risks / Trade-offs

- [Input sequencing] Pause-entry and pause-exit can still race if the implementation reuses one `ESC` event across multiple handlers. -> Mitigation: consume or gate the pause-entry action before root back-navigation becomes active.
- [Scrollbar clarity] A subtle scrollbar may technically exist but still fail to communicate overflow. -> Mitigation: require a visibly rendered thumb or track state when scrolling is available.
- [Shared-surface regressions] Changes to help scrolling can affect both main-menu and pause-menu behavior at once. -> Mitigation: cover both entry points in automated and playtest validation.
- [Keyboard discoverability] Players may not infer which keys scroll long help content. -> Mitigation: use standard up/down navigation or explicit focus-preserving scroll bindings and verify them through the shared menu input model.

## Migration Plan

1. Adjust pause-entry handling so the first gameplay `ESC` press always lands on a visible pause root.
2. Refactor the shared help panel to detect overflow, maintain scroll position, and render a visible scrollbar.
3. Wire the shared help scrolling behavior into both main-menu and pause-menu entry points using the same input affordances.
4. Extend automated and playtest coverage to validate pause visibility plus help scrolling from both contexts.

## Open Questions

No blocking design questions remain for apply. Implementers may choose the exact scrollbar visuals and specific keyboard bindings as long as the shared help panel clearly supports keyboard and pointer or wheel scrolling when content exceeds the viewport.