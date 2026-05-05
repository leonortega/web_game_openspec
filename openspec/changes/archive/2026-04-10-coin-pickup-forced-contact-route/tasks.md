## 1. Spec and validation updates

- [x] 1.1 Update the authored reward-block safety rule so coin blocks are covered by the same immediate post-pickup forced-contact validation as power blocks.
- [x] 1.2 Align the stage-progression requirement text so the post-pickup route safety rule applies to collecting any reward.

## 2. Stage content audit

- [x] 2.1 Re-scan authored coin-block placements for layouts that become invalid under the generalized safety rule.
- [x] 2.2 Move or redesign any affected blocks, enemies, or routes so the pickup remains safely traversable.

## 3. Verification coverage

- [x] 3.1 Add a negative coin-block fixture that proves forced-contact continuation is rejected.
- [x] 3.2 Add a positive coin-block fixture that proves a safe continuation route is accepted.
- [x] 3.3 Add a live playtest probe that confirms a coin pickup does not force immediate enemy contact to continue.

## 4. Validation

- [x] 4.1 Run the build and stage playtest suite against the new change.
- [x] 4.2 Fix any remaining validation or coverage failures until the change is apply-ready.
