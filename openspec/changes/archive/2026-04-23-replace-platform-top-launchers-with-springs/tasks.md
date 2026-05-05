## 1. Catalog Conversion

- [x] 1.1 Replace `forest-bounce-pod-route` in Verdant Impact Crater with spring-platform authoring that uses the full current support footprint at `y460`
- [x] 1.2 Replace `sky-gas-vent-route` in Halo Spire Array with spring-platform authoring that uses the full current support footprint at `y480`
- [x] 1.3 Remove shipped-catalog launcher annotations tied to those two support-platform beats without changing unrelated launcher support

## 2. Validation And Coverage

- [x] 2.1 Update stage validation so spring-platform authoring is accepted for these converted beats while launcher validation still rejects deprecated spring-launcher metadata
- [x] 2.2 Update stage catalog and authoring tests to expect zero shipped-catalog launcher annotations after the conversion
- [x] 2.3 Keep launcher regression coverage in focused tests or fixtures so bounce pods, gas vents, cooldown reuse, and composition cases remain exercised without relying on shipped stages

## 3. Verification

- [x] 3.1 Run targeted automated tests for stage catalog and validation coverage
- [x] 3.2 Run targeted automated tests for game-session launcher and spring behavior coverage
- [x] 3.3 Confirm OpenSpec task list, specs, and implementation remain aligned with shipped-catalog spring conversion scope