## Why

Current hover enemy still reads more like capped drone than original retro ovni, which weakens enemy identity without adding any gameplay value. Repo already has broader saucer language in archived work, so this change should finish that presentation direction now with a bounded refresh that improves silhouette, underside light read, and optional blink polish without reopening behavior or collision semantics.

## What Changes

- Refresh supported hover-enemy presentation into an original retro ovni or saucer silhouette with clearer dome, hull, and underside-light separation.
- Remove top-heavy capped-drone cues and strengthen symmetric lower-hull readability while preserving current hover-only role, lane patrol, bobbing, and fairness.
- Allow a subtle bounded running-light blink or shimmer accent only if it improves ovni identity without becoming a distracting strobe or gameplay telegraph dependency.
- Keep the change presentation-only: no new attacks, no collision or body-footprint changes, no encounter-authoring changes, and no broad internal kind rename unless apply finds a narrow player-facing wording need.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `retro-presentation-style`: tighten flying-enemy art direction so hover enemies read as original symmetric ovni sprites with stronger underside-light readability, clearer canopy-versus-hull separation, and only optional secondary blink-light polish.
- `enemy-hazard-system`: define hover-enemy presentation guardrails that preserve existing hover patrol behavior, bobbing, and body footprint while forbidding new attacks, behavior drift, or strobing blink treatment.

## Impact

- `src/phaser/assets/bootTextures.ts`
- `src/phaser/scenes/gameScene/enemyRendering.ts`
- `src/phaser/view/retroPresentation.ts`
- `src/phaser/scenes/gameScene/bootstrap.ts`
- `src/phaser/scenes/MenuScene.ts`
- Related presentation or playtest coverage for hover-enemy readability and unchanged encounter fairness