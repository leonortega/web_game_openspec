## Context

The existing implementation lengthened stages by scaling authored positions and widths. That preserves rough spacing, but it also inflates every object and changes the intended feel of traversal, hazards, and interactive blocks. The menu also still exposes the current selection and run settings in a prominent top summary, which conflicts with the requested compact presentation.

## Goals / Non-Goals

**Goals:**
- Extend each stage with more authored content so duration increases naturally.
- Keep the authored scale of platforms, blocks, enemies, checkpoints, and rewards intact.
- Keep coin blocks multi-hit, but make each punch reveal a single coin popup.
- Move the selection/run-status readout to a tiny bottom-right footer.

**Non-Goals:**
- Rebalancing every stage encounter from scratch.
- Adding new power types or changing the established reward set.
- Reworking the overall scene flow or stage completion flow.

## Decisions

- Replace the stage-scaling transform with authored expansion. The prior scaling approach is simple, but it distorts the game and creates confusing interactions. Extending duration through additional authored content preserves the intended feel of every object.
- Increase stage duration by adding route structure, not by empty traversal. New platforms, enemy encounters, blocks, and pacing beats should carry the extra playtime so the stage still feels authored rather than stretched.
- Keep coin blocks as repeat-hit objects and standardize their reveal to a single coin popup per hit. That keeps the visual feedback consistent even when a block contains multiple coins.
- Move menu selection status into a small bottom-right footer. The footer keeps settings visible without competing with the title and primary menu choices.

## Risks / Trade-offs

- [Content density] More authored content can make some stages harder than intended if pacing is not tuned carefully. → Mitigation: update playtests and review checkpoints, enemy spacing, and recovery beats after reauthoring.
- [UI readability] A tiny bottom-right footer may be harder to read on smaller viewports. → Mitigation: keep the footer short and use concise labels.
- [Implementation drift] Some of the previous scale-based content may still influence layout assumptions. → Mitigation: remove or bypass the scale transform rather than layering corrections on top of it.
