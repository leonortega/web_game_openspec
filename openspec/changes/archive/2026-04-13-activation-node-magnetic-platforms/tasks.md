## 1. Stage Authoring Model

- [x] 1.1 Extend `src/game/content/stages.ts` and related content validation so stages can author activation nodes, linked magnetic platforms, stable identifiers, and nearby-placement constraints for the bounded rollout
- [x] 1.2 Add or update `src/game/content/stages.test.ts` coverage for valid activation-node magnetic-platform fixtures, dormant-versus-powered authoring expectations, and retry-safe route validation
- [x] 1.3 Author one bounded stage route that uses a nearby activation node to power a floor-only magnetic platform without broadening into wall, ceiling, polarity, or graph-based behavior

## 2. Runtime Power-State Behavior

- [x] 2.1 Update `src/game/simulation/state.ts` to represent activation-node and magnetic-platform runtime power state, including dormant baseline and reset behavior
- [x] 2.2 Update `src/game/simulation/GameSession.ts` so triggering an activation node powers linked platforms on the same update, keeps them floor-solid only while powered, and rebuilds them to dormant state on death, checkpoint respawn, restart, and fresh attempts
- [x] 2.3 Update `src/phaser/scenes/GameScene.ts` so dormant and powered magnetic platforms remain visibly distinct while scene collision and presentation stay synchronized with simulation state

## 3. Verification

- [x] 3.1 Add or extend automated coverage for activation timing, powered top-surface support, and reset behavior across death, checkpoint respawn, and fresh attempts
- [x] 3.2 Update `scripts/stage-playtest.mjs` to validate that the authored magnetic-platform route is readable, retry-safe, and completable without relying on preserved powered state
- [x] 3.3 Run the relevant automated tests and stage playtest validation and record the results for the change