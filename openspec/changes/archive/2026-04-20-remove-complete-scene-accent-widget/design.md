## Context

The current completion scene is structurally centered: it uses a full-screen retro backdrop, an outer frame, a top header strip, a centered summary card, a bottom instruction strip, and centered text blocks. The only off-axis decorative element is a small right-side widget made from a stroked panel plus three horizontal bars. That widget also owns a completion-only tween and particle burst, and the scene's debug snapshot exposes fields that make automation treat the accent as expected behavior.

This change is intentionally narrow. The user asked to remove the whole decorative widget, not merely recolor or simplify its inner bars, while preserving the rest of the completion surface and avoiding unrelated transition cleanup. Apply therefore needs one bounded presentation edit in `CompleteScene`, plus the supporting debug/reporting updates needed so automation no longer expects the removed widget to animate.

## Goals / Non-Goals

**Goals:**
- Remove the complete right-side decorative widget from the completion scene.
- Remove widget-only tween and particle behavior so no orphaned accent remains in the removed region.
- Preserve the existing centered layout, completion text, timing, inputs, auto-advance behavior, and audio handoff.
- Update debug and playtest expectations so verification reflects the new no-widget state.

**Non-Goals:**
- Redesigning the overall completion scene composition.
- Changing stage intro presentation, menu presentation, or broader transition-scene animation policy beyond this widget removal.
- Altering completion timing, auto-advance semantics, or synthesized stage-clear and congratulations audio behavior.
- Refactoring shared retro tween or particle systems that are still needed elsewhere.

## Decisions

### Remove the widget as a whole rather than restyling its internals
Apply should delete the dedicated completion-side panel and the three decorative bars together. This matches the request to remove the whole thing, avoids leaving a hollow panel shell, and keeps the rest of the centered composition untouched.

Alternative considered: keep the outer panel and remove only the colored bars. This was rejected because the user explicitly called out removing the entire widget, and a leftover empty panel would still read as unused accent chrome.

### Treat widget motion as completion-local behavior that should disappear with the widget
The existing completion tween and burst are only there to accent the side widget, so apply should remove both instead of trying to retarget them. This is the safest way to prevent a ghost accent from appearing in the same area after the panel is gone.

Alternative considered: retarget the tween or burst onto the centered summary card or header strip. This was rejected because it broadens scope into overall completion-scene restyling and risks changing the established emphasis of the screen.

### Update completion debug state to reflect absence rather than hidden accent activity
Any completion-scene debug snapshot and downstream playtest logic should move away from treating accent visibility, tween activity, or burst count as proof of correct behavior. The new expected state is that the completion surface renders correctly without a dedicated completion accent widget.

Alternative considered: keep the old debug fields but hard-code them to false or zero. This was rejected as the sole plan because it preserves a misleading debug contract that still centers the removed widget in reporting. Apply may keep compatible fields temporarily if needed, but tests and reports should assert the absence of the widget rather than the inactivity of a conceptual accent.

## Risks / Trade-offs

- [Playtests still expect completion accent animation] -> Update focused completion checks and reporting text in the same apply pass so verification matches the new contract.
- [Scene may look too empty on the right after widget removal] -> Preserve all existing centered frame, summary, and strip elements and make no other spacing changes unless a minimal alignment correction is clearly necessary.
- [Debug consumers may rely on old snapshot fields] -> Keep the update narrow and inspect known playtest callers before changing the snapshot contract.

## Migration Plan

No content or data migration is required. Apply should land the completion-scene widget removal together with the debug/playtest expectation updates so automated verification never observes a mixed state where the widget is gone but reporting still requires it. Rollback is a straightforward revert of the scene change and the associated expectation updates.

## Open Questions

None. The requested scope is narrow enough to proceed directly to apply.