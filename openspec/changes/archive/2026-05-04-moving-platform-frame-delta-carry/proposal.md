## Why

Moving-platform rider carry and support-detach reconstruction currently derive platform displacement from velocity (`vx * deltaSec`, `vy * deltaSec`). This produces unstable behavior when platform velocity is stale or rewritten mid-frame (bounce/clamp containment and falling-platform gravity increments).

Observed failures:
- Bounce/clamp frames can leave `vx` stale or zero after containment, causing rider overshoot or jitter.
- Falling-platform `vy` can change during the update, so rider carry consumes a pre-change value.
- Prior-support reconstruction (`x - vx * deltaSec`, `y - vy * deltaSec`) becomes incorrect on bounce frames, causing false support-detach outcomes.

## What Changes

- Add `prevX` and `prevY` runtime fields to `PlatformState`.
- Record each platform's pre-move position at the start of its per-frame platform update step.
- Compute per-frame realized displacement after movement and containment:
  - `frameDeltaX = platform.x - platform.prevX`
  - `frameDeltaY = platform.y - platform.prevY`
- Use `frameDeltaX` / `frameDeltaY` for rider carry instead of velocity-derived displacement.
- Use `platform.prevX` / `platform.prevY` for prior-support reconstruction instead of reverse-solving from velocity.
- Keep existing detach tolerances and collision semantics; only the data source for same-frame motion is changed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: moving-platform rider carry now uses realized per-frame displacement and deterministic prior-support reconstruction from recorded previous position.

## Backwards Compatibility

- No gameplay feature additions, no authored data schema changes, and no stage migration required.
- `PlatformState` gains runtime fields that default to platform start coordinates when constructed.
- Existing movement paths, limits, and tolerance values remain unchanged.

## Impact

- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- Platform fixture/build helpers that construct `PlatformState` runtime values
