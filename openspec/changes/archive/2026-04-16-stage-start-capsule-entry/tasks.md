## 1. Stage-Start Flow

- [x] 1.1 Update the stage-intro to game handoff so fresh stage starts and auto-advance into a new stage initialize a bounded stage-start arrival path without adding a new transition scene or changing checkpoint respawn behavior.
- [x] 1.2 Add or update focused flow coverage to prove checkpoint respawns stay on the existing direct respawn path while menu starts, replays, and next-stage auto-advance still pass through the new stage-start arrival flow.

## 2. Capsule Arrival Presentation

- [x] 2.1 Implement the `GameScene` stage-start arrival state so normal player control and ordinary multipart player rendering stay suppressed until the bounded capsule-arrival appearance beat resolves.
- [x] 2.2 Reuse or factor capsule presentation constants or helpers as needed so the stage-start arrival reads as the mirrored visual language of the exit capsule without turning the spawn beat into a second completion endpoint.
- [x] 2.3 Verify the arrival presentation stays local, readable, and timing-stable against surrounding spawn geometry and does not require new audio ownership for this change.

## 3. Regression Coverage And Validation

- [x] 3.1 Update affected scene, simulation, or playtest coverage to assert fresh stage entry and next-stage auto-advance show the capsule-arrival appearance beat before active control begins.
- [x] 3.2 Run `npm test` and `npm run build`, then fix any regressions introduced by the stage-start arrival implementation.
- [x] 3.3 Run relevant stage-flow playtest coverage and confirm the intro surface remains readable, the arrival resolves before control starts, and checkpoint respawns do not replay the arrival sequence.