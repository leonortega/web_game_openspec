## Why

The current MVP stage definition is optimized for compact levels, which is useful for prototyping but too short for a fuller platform-game session. The game now needs longer stages that sustain player engagement for at least 10 minutes of first-time play while preserving readable progression and checkpoint pacing.

## What Changes

- Expand stage structure from short challenge rooms into multi-segment levels with sustained traversal, enemy cadence, and recovery beats.
- Modify stage progression requirements so each main stage targets a minimum of 10 minutes for a first-time clear by an average player.
- Add explicit pacing expectations for checkpoints, sub-goals, and escalation across each stage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `stage-progression`: Stage requirements will change from compact MVP progression to longer multi-segment stages with a minimum target duration and stronger pacing structure.

## Impact

- Changes the gameplay contract for stage layout, checkpoint distribution, and level content volume.
- Requires updates to authored stage data, progression tuning, and encounter spacing in the platformer implementation.
- May require corresponding content adjustments to enemy placement and collectible distribution so long stages remain readable.
