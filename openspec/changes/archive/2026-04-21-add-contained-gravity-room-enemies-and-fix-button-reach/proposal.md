## Why

The current enclosed gravity-room rollout now supports contained interior enemies, but it still does not make one critical player-facing rule explicit: while room gravity is active, the player must be able to use the existing jump and contact-based button interaction to reach and disable the room. That gap leaves room authoring and validation free to create gravity-room beats where the intended button route feels backwards, reads like the jump is fighting the player, or places interior enemies where they crowd the only deactivation path.

## What Changes

- Make enclosed gravity rooms explicitly require a readable, intended route from room entry to the interior disable button while the room field is still active.
- Define the expected player-facing movement read for active gravity rooms: the player keeps the normal initial jump impulse and existing contact-based button interaction, and room gravity may bend the airborne arc only after takeoff without making the authored button route effectively unreachable.
- Require enclosed gravity-room authoring and validation to reject button placements, floor or ceiling geometry, or interior encounter layouts that force a misleading downward-feeling deactivation route, block the only intended button approach, or depend on a compliance-only helper platform.
- Allow contained interior enemies inside gravity rooms only when their placement preserves room readability, keeps the button-deactivation route path-critical, and does not crowd, pin, or replace the intended traversal beat.
- Preserve all settled gravity-room constraints: enclosed shell, side-wall `IN`-left and `OUT`-right flow, player-only gravity effect, contact-based button disable, retry or reset semantics, and no enemy gravity changes.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `player-controller`: enclosed gravity rooms now explicitly guarantee that active room gravity bends airborne motion after a normal jump impulse without invalidating reachable button-deactivation play.
- `platform-variation`: gravity-room authoring now requires contained interior enemies and room geometry to preserve a readable, path-critical button route under active room gravity.
- `stage-progression`: gravity-room validation and route semantics now reject authored rooms whose active-gravity button path is not reachable or readable with the existing jump and contact-based disable flow.

## Impact

- Affected OpenSpec specs: `player-controller`, `platform-variation`, and `stage-progression`.
- Expected implementation areas: gravity-room stage authoring and validation, enclosed room layout data, button placement constraints, and any runtime or playtest logic that proves button reachability with active room gravity and contained enemies.
- Expected verification areas: stage validation coverage, focused gravity-room gameplay tests, and room-specific playtests that show the player can still jump, reach the button, and disable the room without new inputs or helper-only geometry.