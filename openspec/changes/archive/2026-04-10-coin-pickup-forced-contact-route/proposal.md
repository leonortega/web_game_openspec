## Why

Coin reward blocks currently only have the basic placement safety check, which is not enough when collecting the coin would leave the player with no safe way to continue. This change closes that gap so coin blocks cannot create a forced-contact route that makes the pickup effectively unsafe or unrecoverable.

## What Changes

- Extend the post-pickup safety rule to coin reward blocks, not just power blocks.
- Reject authored coin-block placements that force the player to touch an enemy immediately after pickup in order to continue.
- Keep safe coin-block routes valid when the player can proceed without unavoidable enemy contact.
- Expand verification coverage to include both negative forced-contact cases and positive safe coin routes.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `interactive-blocks`: reward blocks must keep the intended post-pickup route safely traversable for coin rewards as well as power rewards.
- `stage-progression`: authored progression routes after collecting any reward must remain passable without unavoidable enemy contact.

## Impact

- Stage authoring validation in `src/game/content/stages.ts`.
- Regression coverage in `scripts/stage-playtest.mjs`.
- Spec text for authored reward blocks and safe route continuation.
