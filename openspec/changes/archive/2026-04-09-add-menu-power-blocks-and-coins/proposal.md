## Why

The current game flow ties power growth too closely to stage progression and does not give the player a clear place to configure how the run should feel. This change adds a proper front door to the game and makes powers and recovery rules more explicit, which improves replayability and makes level authoring more flexible.

## What Changes

- Add a main menu with `Start`, `Volume`, `Enemies`, `Rules`, and selectable difficulty controls.
- Add interactive blocks that grant either coins or one of four fixed powers.
- Remove stage-dependent power granting so powers are earned from authored blocks instead.
- Keep powers across later levels if the player survives, but clear them when the player is hurt or dies.
- Restore full energy when the player collects all coins in a level.

## Capabilities

### New Capabilities
- `main-menu`: start flow, volume control, enemy pressure selection, rules explanation, and difficulty selection.
- `interactive-blocks`: authored blocks that award either coins or fixed powers.
- `coin-energy-recovery`: level coin completion restores the player's full energy.

### Modified Capabilities
- `player-controller`: active powers are granted by blocks, include the four named powers, and are cleared on damage or death.
- `player-progression`: powers persist into later levels if not lost, rather than depending on the current stage.

## Impact

- Scene flow needs a richer menu entry point and settings handoff into gameplay.
- Stage data needs authored reward blocks for coins and powers.
- Player state needs to persist active powers across levels and clear them on damage or death.
- HUD and progression feedback need to reflect coin completion and currently active powers.
