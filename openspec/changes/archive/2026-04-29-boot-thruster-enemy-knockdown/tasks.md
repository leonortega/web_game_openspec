## 1. Controller And Combat Behavior

- [x] 1.1 Add airborne downward thruster pulse input handling.
- [x] 1.2 Add thruster pulse fuel and cooldown state to player runtime.
- [x] 1.3 Replace stomp defeat gating with active thruster-impact gating from above.
- [x] 1.4 Keep projectile defeat behavior unchanged.

## 2. Audio And Defeat-Cause Routing

- [x] 2.1 Add synthesized thruster pulse / thruster impact cues.
- [x] 2.2 Route enemy defeat cause and feedback from stomp to thruster-impact where appropriate.

## 3. Spec And Test Coverage

- [x] 3.1 Update player-controller spec delta from stomp defeat to thruster-impact defeat semantics.
- [x] 3.2 Update audio-feedback spec delta from stomp cue language to thruster-impact cue language.
- [x] 3.3 Update or add simulation tests for fuel, cooldown, and thruster-impact defeat behavior.
- [x] 3.4 Update bridge/audio/presentation tests impacted by new input and defeat cause names.

## 4. Verification

- [x] 4.1 Run targeted unit tests for modified modules.
- [x] 4.2 Run full test suite (suite still has unrelated pre-existing failures in `rewardRendering.test.ts` and `app.test.ts` outside this change).
