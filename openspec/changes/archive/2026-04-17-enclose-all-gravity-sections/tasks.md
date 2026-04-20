## 1. Full Gravity-Room Rollout

- [x] 1.1 Update authored stage data in `src/game/content/stages.ts` so every anti-grav stream and gravity inversion column in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array is enclosed in its own gravity room instead of left as an open field.
- [x] 1.2 Revise each room shell, entry opening, exit opening, and room-local route so the room stays fully enclosed except for separate bottom entry and bottom exit doors.
- [x] 1.3 Ensure each rolled-out room is large enough to contain its field, platforms, enemies, hazards, pickups, disable button, and intended traversal route without cropped or unreachable geometry.

## 2. Validation And Runtime Coverage

- [x] 2.1 Extend authored validation and `src/game/content/stages.test.ts` so current playable stages fail if any authored gravity-modification section remains open or if any enclosed room violates containment, door-placement, or reachability rules.
- [x] 2.2 Add or update `src/game/simulation/GameSession.test.ts` coverage so the existing enclosed-room controller and reset semantics remain correct across the broader multi-room rollout.
- [x] 2.3 Update `src/game/simulation/GameSession.ts` only as needed to keep room disable behavior, reset behavior, and room-to-field mapping deterministic across all converted stages.

## 3. Presentation And Playtest Coverage

- [x] 3.1 Update `src/phaser/scenes/GameScene.ts` so enclosed gravity rooms consistently present the requested blue shell outline, black platforms, red enemies, and yellow interior disable button while staying distinct from stage exits.
- [x] 3.2 Update `scripts/stage-playtest.mjs` and `scripts/traversal-category-visual-language-playtest.mjs` so the full-room rollout, interior-button reachability, and no-open-field expectation are exercised in scripted verification.
- [x] 3.3 Run the relevant automated tests and scripted playtests, then record that all current playable gravity-modification sections now use enclosed rooms and satisfy containment and readability requirements.