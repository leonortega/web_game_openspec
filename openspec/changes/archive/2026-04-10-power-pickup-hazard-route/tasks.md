## 1. Authoring Rules

- [x] 1.1 Extend reward-block validation so a power pickup cannot leave the intended route in a forced-contact state immediately after collection, including non-stompable hazard enemies.
- [x] 1.2 Update the stage-authoring checks to reject or flag unsafe post-pickup reward layouts while preserving valid safe routes.

## 2. Stage Content

- [x] 2.1 Adjust affected stage layouts so reward blocks no longer sit on routes where the player must touch a hazard enemy to continue after gaining the power.
- [x] 2.2 Re-run the stage content validation against the updated layouts and resolve any remaining unsafe placements.

## 3. Verification

- [x] 3.1 Add a negative regression probe in `scripts/stage-playtest.mjs` for the hazard-enemy trap case where a power block is followed by unavoidable enemy contact that clears the reward.
- [x] 3.2 Add a positive regression probe in `scripts/stage-playtest.mjs` for a nearby hazard-enemy layout that remains safe because the player can continue without forced contact.
- [x] 3.3 Add a live traversal probe that confirms the player can keep the new power while bypassing the hazard enemy through a safe continuation route.

## 4. Validation

- [x] 4.1 Run the targeted stage playtest suite and confirm the unsafe fixture fails while the safe fixture and live probe pass.
- [x] 4.2 Run the full project build or verification command set to confirm the change is consistent with the updated specs.
