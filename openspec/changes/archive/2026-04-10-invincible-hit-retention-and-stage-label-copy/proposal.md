## Why

The stage title currently exposes authoring-oriented duration copy in the main gameplay HUD, which adds noise to a surface the player reads during active play. Separately, invincibility is routed through the same powered-hit loss rule as every other power, so a damaging contact can incorrectly consume the very protection that should remain active until its timer ends.

## What Changes

- Remove the duration suffix from the player-visible stage label in the main gameplay HUD so it shows only the authored stage name.
- Preserve invincibility through damaging contact while the invincibility timer is active, even when the generic powered-hit path is triggered.
- Keep the existing powered-hit shield behavior for other active powers unless invincibility is also active, in which case only the non-invincible powers are cleared.
- Update automated coverage and any player-facing rules text that still claim every active power is lost on any powered hit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gameplay-hud`: the primary stage label no longer includes duration or distance suffix copy during active play.
- `player-progression`: invincibility remains active through damaging contact until its timer expires, while other powers keep the existing powered-hit loss rule.
- `player-controller`: damaging contact must preserve invincibility on protected hits instead of clearing every active power through the shared damage path.

## Impact

- `src/ui/hud/hud.ts`
- `src/phaser/adapters/sceneBridge.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- Player-visible HUD stage copy and power-loss messaging