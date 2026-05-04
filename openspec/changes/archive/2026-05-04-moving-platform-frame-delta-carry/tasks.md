## 1. Platform Runtime State

- [x] Add prevX/prevY to PlatformState type
- [x] Initialize prevX/prevY in platform runtime construction

## 2. Platform Update Semantics

- [x] Update updatePlatforms() to record prevX/prevY before movement
- [x] Replace rider carry with frameDeltaX/frameDeltaY
- [x] Replace prior-support reconstruction with platform.prevX/prevY
- [x] Update supportMovedAwayThisFrame check

## 3. Regression Coverage

- [x] Add regression tests: bounce-frame rider carry, falling-platform rider carry

## 4. Verification And Completion

- [x] Verify all tests pass (npm test)
- [ ] Archive
