## 1. Main-Stage Terrain Removal

- [x] 1.1 Replace `brittleCrystal` and `stickySludge` usage on green-top route platforms in `src/game/content/stages/catalog.ts` for Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array with plain static platforms that preserve the authored route geometry.
- [x] 1.2 Adjust only the local support geometry or neighboring route annotations needed to keep those replaced sections readable and traversable without hidden terrain behavior.

## 2. Validation And Regression Alignment

- [x] 2.1 Update stage validation and authoring tests so current main-stage plain green platforms reject or fail any remaining hidden `brittleCrystal` or `stickySludge` usage while launcher, spring, gas vent, and other supported traversal distinctions remain intact.
- [x] 2.2 Keep or retarget focused brittle/sticky automated coverage outside the current main stages so legacy overlay rejection, brittle state transitions, sticky grounded drag, and sticky jump-preservation behavior still stay protected.

## 3. Scripted Coverage And Verification

- [x] 3.1 Update scripted playtest coverage and analysis so campaign checks no longer expect brittle/sticky rollout in Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array and instead confirm those green-top routes are plain support.
- [x] 3.2 Run focused validation, authoring tests, runtime tests, and scripted playtests needed to prove current main stages no longer hide terrain mechanics while non-campaign brittle/sticky regression coverage still passes.