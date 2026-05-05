# Design: Moving Platform Frame-Delta Carry

## Overview

Replace velocity-derived moving-platform carry and prior-support reconstruction with position-derived per-frame deltas. The update computes actual movement from recorded pre-frame platform position, ensuring carry and detach decisions reflect final contained platform motion for that frame.

## Data Model Changes

### PlatformState

Add two runtime position-history fields:
- `prevX: number`
- `prevY: number`

Initialization rule:
- On platform runtime construction, initialize `prevX` with `startX` and `prevY` with `startY`.

Rationale:
- Guarantees defined previous-position values on frame 0 and in tests/fixtures.

## updatePlatforms() Algorithm Change

For each platform on each simulation frame:

1. Record pre-move position
- `platform.prevX = platform.x`
- `platform.prevY = platform.y`

2. Apply platform movement logic
- Existing movement integration remains unchanged (velocity, gravity for falling platforms, etc.).

3. Apply containment/clamp/bounce resolution
- Existing bound enforcement remains unchanged.

4. Compute realized frame displacement after all movement and containment
- `frameDeltaX = platform.x - platform.prevX`
- `frameDeltaY = platform.y - platform.prevY`

Key property:
- `frameDeltaX` / `frameDeltaY` represent actual same-frame support motion seen by riders.

## Rider Carry Change

Current behavior (to be replaced):
- Carry rider by velocity-derived displacement (`vx * deltaSec`, `vy * deltaSec`).

New behavior:
- Carry rider by realized displacement (`frameDeltaX`, `frameDeltaY`).

Effect:
- Bounce/clamp frames and falling-platform gravity-update frames carry riders by actual final platform motion, removing stale-velocity jitter/overshoot.

## Prior-Support Reconstruction Change

Current behavior (to be replaced):
- Reconstruct prior support position from current position minus velocity-derived displacement.

New behavior:
- Use explicitly stored prior position:
  - `priorSupportX = platform.prevX`
  - `priorSupportY = platform.prevY`

Effect:
- Detach reconstruction is frame-accurate even when current velocity was changed by containment logic.

## supportMovedAwayThisFrame Evaluation

Current behavior:
- Uses reconstructed prior support based on velocity-derived displacement.

New behavior:
- Evaluate with `platform.prevX` / `platform.prevY` and same current tolerances.

Effect:
- Support-detach trigger aligns with actual platform motion, reducing false positives/negatives around bounce frames.

## Testing Strategy

Add regression tests in `src/game/simulation/GameSession.test.ts`:
- Bounce-frame rider carry uses realized frame displacement and avoids overshoot/jitter.
- Falling-platform rider carry uses realized frame displacement when `vy` changes mid-frame.

Keep existing detach and tolerance tests; update expectations only where stale-velocity artifacts were previously encoded.

## Non-Goals

- No tolerance retuning (`±8`, `±6`) in this change.
- No moving-platform path authoring changes.
- No controller semantic changes outside carry/reconstruction data source swap.
