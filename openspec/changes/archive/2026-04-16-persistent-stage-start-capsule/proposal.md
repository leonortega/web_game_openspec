## Why

Fresh stage starts currently use a short transient capsule-arrival beat that disappears as soon as the player appears. The requested behavior keeps that start capsule in the world as a grounded inert prop after arrival, adds a bounded door-close beat, and preserves the existing rule that checkpoint respawns do not replay the stage-start arrival.

## What Changes

- Change fresh stage-start presentation so the arrival capsule remains on the stage as a fixed grounded prop after the player appears.
- Add a short bounded door-close animation on the stage-start capsule after the player reveal and before or as active control begins.
- Keep the start capsule non-interactive and non-usable after arrival, with no new traversal or gameplay behavior.
- Preserve existing checkpoint-respawn behavior so respawns within the same stage attempt do not replay the stage-start presentation or restore the arrival sequence.
- Tighten the presentation contract so the persistent start capsule remains visually distinct from completion exits and gravity capsules.
- Update scripted validation coverage for stage-start capsule behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `stage-progression`: change fresh stage-start requirements so the in-world capsule-arrival beat can leave behind a persistent inert grounded start capsule with a bounded post-reveal door-close animation, while checkpoint respawns still skip the arrival.
- `stage-transition-flow`: clarify the stage-intro handoff so the bounded in-world arrival beat may include a short post-reveal door-close moment without changing scene ordering or requiring extra input.
- `retro-presentation-style`: refine the stage-start capsule presentation so the persistent grounded start capsule reads as arrival-only infrastructure and stays visually distinct from stage exits and gravity capsules.

## Impact

- Affected code is expected in `src/phaser/scenes/GameScene.ts` and `src/phaser/view/capsulePresentation.ts`.
- Affected scripted coverage is expected in `scripts/stage-start-capsule-entry-playtest.mjs` and possibly `scripts/stage-playtest.mjs`.
- No new gameplay systems, progression branches, or audio requirements are introduced by this change.