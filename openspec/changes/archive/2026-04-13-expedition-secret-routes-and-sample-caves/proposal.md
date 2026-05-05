## Why

The current stage specs allow optional detours, but they do not yet define a stronger authored standard for hidden expedition spaces that feel like abandoned micro-areas, reward discovery with optional sample caves, and reconnect cleanly to the main route later in the same stage. Tightening that contract now gives stage authors a bounded way to deepen exploration using the engine's existing route mechanics instead of drifting into alternate endings or a new branching progression system.

## What Changes

- Expand stage authoring expectations so main stages can include hidden expedition secret routes that branch off the critical path, pass through a small abandoned micro-area or optional sample cave, and reconnect to the main route later in the same stage.
- Define what qualifies as an abandoned micro-area: a compact off-route authored space that reads as a previously used or partially collapsed expedition pocket, contains at least one readable reward or traversal beat, and remains non-mandatory for stage completion.
- Define what qualifies as an optional sample cave: a hidden cave-like reward pocket that requires exploration or route awareness, contains research samples or an equivalent optional reward cluster, and returns the player to the primary route without creating a second stage-completion exit.
- Define secret exits for this bounded change as hidden connectors or branch exits that rejoin the main route downstream inside the same stage, not as alternate stage-clear outcomes, branching unlocks, or multiple completion exits.
- Keep discovery based on authored layout and already supported traversal mechanics unless implementation work identifies a minimal marker need for validation or presentation; no new branching progression state is proposed at the spec level.
- Add validation and playtest expectations proving that each authored secret route is discoverable through layout cues, offers meaningful optional reward value, and reconnects to the main route later without trapping or bypassing the core stage flow.

## Capabilities

### Modified Capabilities
- `stage-progression`: Main stages gain stronger authored requirements for hidden reconnecting secret routes, abandoned micro-areas, optional sample caves, and validation of their reward and reconnection value.
- `platform-variation`: Optional traversal lines gain route-quality expectations for hidden connector branches that rely on existing authored traversal mechanics and rejoin the main path later.

## Impact

- `src/game/content/stages.ts`
- `scripts/stage-playtest.mjs`
- Potentially `src/game/simulation/GameSession.ts` and `src/game/simulation/state.ts` if route markers or validation metadata need runtime exposure
- Potentially `src/phaser/scenes/GameScene.ts` if secret-route readability requires presentation of existing authored connectors
- Stage fixtures, authored stage layouts, and tests covering optional route discovery and reconnection