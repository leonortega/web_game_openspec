## Why

Reward blocks currently can create a trap where the player gains a power and then has no safe continuation route, so the only way forward is to take enemy damage and immediately lose the new power. That breaks the intended reward loop and needs to be prevented both in authored stage validation and in regression coverage.

## What Changes

- Tighten authored reward-block validation so power pickups cannot be placed on routes that force immediate enemy damage after reveal.
- Require stage content to leave a safe continuation corridor after a reward block is revealed and collected, not just a technically reachable punch path.
- Add regression coverage for the unsafe power-pickup trap so the verification flow catches both blocked and safe layouts.
- Update affected stage content where reward blocks currently create a forced-hit continuation.

## Capabilities

### New Capabilities

### Modified Capabilities
- `interactive-blocks`: reward blocks must not only be reachable and non-overlapping with stompable enemies, but also leave a safe post-pickup continuation path that does not require immediate damage.
- `stage-progression`: authored routes must preserve clean progression after reward pickup so a power grant does not immediately collapse into a forced-hit state.

## Impact

Affects stage authoring validation, stage content placement, playtest verification in `scripts/stage-playtest.mjs`, and any stage fixtures that currently rely on unsafe reward-block positioning.
