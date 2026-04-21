## Why

The completion screen still includes a small decorative right-side widget that is not needed for stage-clear readability and now reads like leftover accent chrome beside an otherwise centered results layout. Removing only that widget is the narrowest change that simplifies the surface without disturbing the established completion flow, summary card, text hierarchy, timing, or audio behavior.

## What Changes

- Remove the dedicated right-side decorative widget from the stage-clear and final-congratulations completion surface.
- Keep the existing centered completion layout, including the outer frame, header strip, summary card, bottom strip, text content, timing, and scene flow.
- Remove any tween or particle burst that exists only to animate that widget so the cleared surface does not leave a ghost accent in the same screen region.
- Update debug snapshots and playtest/reporting expectations that currently require the completion-scene accent animation.
- Avoid broader intro-scene, stage-transition, or transition-system cleanup outside this specific completion-surface widget removal.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-transition-flow`: completion transition surfaces no longer include the dedicated right-side accent widget or any widget-only motion tied to it.

## Impact

- `src/phaser/scenes/CompleteScene.ts`
- Completion-scene debug snapshot shape and any callers that interpret completion accent state
- `scripts/stage-playtest.mjs`
- Any focused playtest or reporting output that still treats completion accent animation as required behavior