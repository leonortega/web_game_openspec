## 1. Stage Authoring And Validation

- [x] 1.1 Extend `src/game/content/stages.ts` so stages can author gravity capsule shells, linked buttons, linked anti-grav or gravity-inversion fields, and contained route metadata with stable identifiers
- [x] 1.2 Add or update authored-data validation so gravity capsule sections require a reachable linked button, contained traversable route geometry inside the shell, and a retry-safe dormant-state fallback or retrigger path
- [x] 1.3 Add or update `src/game/content/stages.test.ts` coverage for valid and invalid gravity capsule authoring, including unreachable buttons and uncontained capsule routes

## 2. Runtime Capsule State And Controller Gating

- [x] 2.1 Extend `src/game/simulation/state.ts` to represent gravity capsule button and enabled-state runtime data with dormant baseline and reset behavior
- [x] 2.2 Update `src/game/simulation/GameSession.ts` so button contact enables linked capsule sections on the same update, keeps them latched until reset, and restores dormant state on death, checkpoint respawn, restart, and fresh attempts
- [x] 2.3 Update controller-facing gravity-field handling so enabled capsule sections gate anti-grav or gravity-inversion acceleration without changing jump, launcher, or dash priority semantics
- [x] 2.4 Add or update `src/game/simulation/GameSession.test.ts` coverage for activation timing, dormant-versus-enabled field behavior, dash composition, and retry resets

## 3. Scene Presentation And Verification

- [x] 3.1 Update `src/phaser/scenes/GameScene.ts` so gravity capsule shells, doors, buttons, and field cues stay synchronized with dormant versus enabled simulation state and remain visually distinct from the stage exit capsule
- [x] 3.2 Author at least one bounded stage route that uses a gravity capsule section with a reachable linked button and contained internal traversal geometry
- [x] 3.3 Update `scripts/stage-playtest.mjs` to exercise gravity capsule activation, dormant-state retry behavior, and route containment expectations in scripted coverage
- [x] 3.4 Run the relevant automated tests and stage playtest validation and record the results for the change