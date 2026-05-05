## Why

The current game already has authored stages and reward blocks, but the stage spaces are still tuned for the existing pacing and the blocks behave like one-shot pickups. The next step is to make the levels feel meaningfully larger and to make blocks read like classic punch blocks from below, with visible feedback for each hit.

## What Changes

- Double the authored length of each main stage and re-space the route so the added length is intentional rather than empty travel.
- Update stage layouts so segments, checkpoints, collectibles, enemies, reward blocks, and exits all scale with the longer route.
- Make interactive blocks punchable from below with enough vertical clearance between the floor and the block to support the interaction.
- Allow coin blocks to require multiple punches, with one punch consumed per coin stored in the block.
- Show the awarded coin or power as a transient visual reveal for 1 second, then fade it out.
- Preserve deterministic authored reward behavior for both coin and power blocks.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `stage-progression`: stage length, route spacing, and authored pacing requirements change to support doubled-length stages.
- `interactive-blocks`: blocks become punchable from below, coin blocks can require multiple hits, and each punch must produce a short-lived reward reveal.

## Impact

- Stage content data for routes, segments, checkpoints, enemies, collectibles, exits, and reward block placement.
- Runtime collision and reward-block handling for repeated underside punches and per-hit reward reveals.
- Block rendering and animation so punched rewards appear briefly and fade out.
- Playtest expectations for longer stages and block-hit readability.
