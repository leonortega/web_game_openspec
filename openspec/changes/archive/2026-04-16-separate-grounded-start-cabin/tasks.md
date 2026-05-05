## 1. Start-Cabin Anchor Ownership

- [x] 1.1 Update fresh-stage start setup so the cabin resolves from a dedicated fixed grounded anchor instead of deriving placement from the player rectangle.
- [x] 1.2 Add any minimal stage or simulation plumbing needed to provide or preserve that fixed start-cabin anchor without expanding unrelated stage authoring.

## 2. Sequence Separation And Presentation

- [x] 2.1 Refactor start-cabin presentation in `src/phaser/view/capsulePresentation.ts` and `src/phaser/scenes/GameScene.ts` so the cabin remains a separate inert world prop before, during, and after the arrival sequence.
- [x] 2.2 Update the fresh-start sequence so the player rematerializes inside the fixed cabin, walks out through a deterministic pre-control path, the cabin closes in place, and checkpoint respawns continue to bypass the sequence.

## 3. Validation And Regression Coverage

- [x] 3.1 Add or update automated coverage for fresh starts, next-stage auto-advance, and checkpoint respawns to verify fixed-cabin ownership and bypass behavior.
- [x] 3.2 Update focused playtest coverage to confirm the start cabin stays grounded at a static world position, the player walks out from it, and the cabin remains behind as an inert prop.
- [x] 3.3 Run the relevant test, build, and start-sequence playtest commands and fix regressions introduced by the change.