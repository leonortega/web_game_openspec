## Why

Active-play transient messages currently include long authored stage hints, segment-focus banners, and combat-status narration that read more like internal debug notes than player help. The lower-left message lane is most valuable when it delivers short, actionable information the player can use immediately, and much of the current copy adds noise instead.

## What Changes

- Remove long stage-start hint copy and segment-focus banners from the transient gameplay message lane.
- Keep only short player-useful messages in active play, such as objective briefings and reminders, checkpoint and route-state changes, power pickups, and major reward-state updates.
- Remove generic combat and automatic-flow narration that the player already understands from animation, audio, and HUD state, such as enemy-defeat, damage, shield-break, invincibility-expire, and respawn messages.
- Tighten the remaining transient copy so it stays fiction-consistent, brief, and readable in the existing HUD lane.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- gameplay-hud: transient active-play copy now follows a stricter short useful-message policy instead of showing long authored hints or generic combat narration.
- stage-progression: objective, checkpoint, reveal-route, bridge, exit-reminder, and major reward messages continue to use the transient stage-message flow, but segment-focus and long route-summary copy no longer do.

## Impact

- src/game/simulation/GameSession.ts
- src/game/simulation/state.ts
- src/game/simulation/GameSession.test.ts
- src/game/simulation/state.test.ts
- Active-play transient message cadence and message-selection policy