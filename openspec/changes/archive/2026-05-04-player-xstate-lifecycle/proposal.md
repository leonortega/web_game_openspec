# Proposal: Player XState Lifecycle Machine

## Summary
Replace flat boolean state flags (`dead`, `onGround`) and scattered timer logic in `PlayerState` with an explicit XState state machine modeling player lifecycle: **idle**, **run**, **jump**, **fall**, **dash**, **hurt**, **dead**. Preserves all current movement behavior while preventing impossible state combinations and enabling explicit lifecycle tracking.

## Goal
Achieve explicit, model-driven player state management that:
- Eliminates impossible state combinations (e.g., simultaneously `dead` and `onGround`)
- Models complete player lifecycle with well-defined transitions
- Maintains exact current behavior for all platformer mechanics
- Ensures backwards-compatible reads via proxy wrapper

## Scope: What's In

### State Machine Lifecycle
Seven explicit states capturing all player conditions:
- **idle**: Grounded, no input, not moving horizontally
- **run**: Grounded, moving horizontally with input
- **jump**: Airborne after jump initiation (includes short jump-pose hold window from current spec)
- **fall**: Airborne during descent or after jump apex
- **dash**: Active dash movement (directional override)
- **hurt**: Post-hit invulnerability window
- **dead**: Death presentation before respawn

### Context & Timers
Machine context holds locomotion state; parallel timers remain in `PlayerState`:
- Locomotion: `moveDir`, `jumpIntent`, `dashIntent`, `isDashing`
- Timers untouched: `coyoteMs`, `jumpBufferMs`, `invulnerableMs`, `dashTimerMs`, `dashCooldownMs`, `shootCooldownMs`, `thrusterPulseCooldownMs`, `thrusterImpactWindowMs`
- Physics untouched: `vx`, `vy`, `x`, `y`, `width`, `height`, `gravityScale`

### Backwards Compatibility
Proxy wrapper on machine state provides transparent reads:
- `player.dead` → `machine.matches('dead')`
- `player.onGround` → `machine.matches('idle') || machine.matches('run')`
- Old code sees same boolean values; internal state is machine-driven

### Integration Points
1. **state.ts**: Define machine, types, proxy factory
2. **GameSession.ts**: Replace boolean conditionals with `state.send(event)`
3. **GameSession.test.ts**: Verify state transitions and physics outcomes
4. **package.json**: Add `xstate` dependency

## Scope: What's Out
- Wall-slide state (physics-implicit, handled in fall)
- Double-jump tracking (remains in `airJumpsRemaining` counter)
- Spawn/checkpoint mechanics (respawn already works, machine just adds lifecycle tracking)
- Serialization changes (old save/load must continue working)

## Key Constraints
1. **No Breaking Serialization**: Machine state must serialize/deserialize identically to current system
2. **Performance**: Profile update loop before/after; must hit 60fps consistently
3. **Backwards Compat**: All existing code reading `player.dead` or `player.onGround` continues working
4. **Spec Compliance**: All player-controller spec requirements must pass verification

## Technical Decisions

### Reason for XState
- Explicit state graph prevents impossible combinations
- Lifecycle becomes code-readable rather than scattered booleans
- Enables future features (state-based audio, animation locking)
- Clear audit trail of state transitions for debugging

### Why Not Full Redesign
- Current physics constants and movement feel are solid
- Machine is thin wrapper around existing logic
- Incremental refactor reduces risk
- Proxy layer makes transition painless

### Proxy Strategy
After machine definition, wrap machine state in Proxy that intercepts `.dead` and `.onGround` reads:
```
player.dead         // => machine.matches('dead')
player.onGround     // => machine.matches('idle') || machine.matches('run')
```
GameSession keeps reading same properties; internal code uses `state.send(event)` for transitions.

## Success Criteria
- [ ] XState machine defined with 7 states + transitions
- [ ] All player-controller spec scenarios pass
- [ ] `npm test` passes (100% task-completion coverage)
- [ ] No perf regression at 60fps (profile in apply stage)
- [ ] Old code reading `player.dead` still works
- [ ] Backwards-compat serialization verified
- [ ] Build succeeds with no type errors

## File Impact Summary
| File | Change |
|------|--------|
| `src/game/simulation/state.ts` | +Machine def, +types, +proxy wrapper (~150 lines) |
| `src/game/simulation/GameSession.ts` | ~20 state.send() calls, ~30 conditionals removed (~200 lines modified) |
| `src/game/simulation/GameSession.test.ts` | +Transition verification tests (~80 lines) |
| `package.json` | +xstate dependency |
