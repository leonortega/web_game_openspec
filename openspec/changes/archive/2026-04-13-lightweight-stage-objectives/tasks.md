## 1. Stage Objective Authoring

- [x] 1.1 Extend authored stage data and validation in `src/game/content/stages.ts` for one optional lightweight objective per participating stage
- [x] 1.2 Author a small rollout of beacon, relay, or lift-tower objective stages using existing contact or activation hooks

## 2. Runtime Objective Flow

- [x] 2.1 Add lightweight objective state to the stage/session runtime in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`
- [x] 2.2 Gate exit completion on authored objective completion while preserving immediate completion for stages without objectives
- [x] 2.3 Reuse existing scene bridge and gameplay message surfaces to brief objectives and remind the player on incomplete exit contact

## 3. Verification

- [x] 3.1 Add automated coverage for objective activation, fresh-attempt reset, same-attempt respawn persistence, and incomplete-exit blocking
- [x] 3.2 Update scripted playtest coverage to exercise at least one objective-authored stage through both incomplete and complete exit paths
- [x] 3.3 Run build and focused validation for the authored rollout and capture any playtest evidence needed for the change