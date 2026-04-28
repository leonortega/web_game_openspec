## 1. Falling Platform Timing Semantics

- [x] 1.1 Extend falling-platform runtime state and config ingestion to support `stayArmThresholdMs` and `hopGapThresholdMs` for contact-pattern evaluation.
- [x] 1.2 Update falling-platform support detection in `src/game/simulation/GameSession.ts` so countdown arming requires 120 ms of accumulated top-surface support contact, preserving accumulation only across unsupported gaps <= 50 ms and resetting it after larger gaps.
- [x] 1.3 Update armed countdown behavior so falling-platform time decreases only while player has valid top-surface support contact on that platform.

## 2. Controller Compatibility Guardrails

- [x] 2.1 Preserve normal jump initiation while falling-platform top-surface support remains valid, including edge timing near arming/collapse boundaries.
- [x] 2.2 Preserve existing support-detach single-frame former-support horizontal collision exemption behavior without broadening it to other solids.
- [x] 2.3 Keep brittle platform behavior and gravity-field behavior unchanged by this change.

## 3. Automated Coverage

- [x] 3.1 Add or update `src/game/simulation/GameSession.test.ts` for stay-vs-hop thresholds:
- [x] 3.1.1 skim contact under 120 ms does not arm.
- [x] 3.1.2 sustained contact reaching 120 ms arms.
- [x] 3.1.3 unsupported gap <= 50 ms preserves pre-arm stay accumulation.
- [x] 3.1.4 unsupported gap > 50 ms resets pre-arm stay accumulation.
- [x] 3.2 Add or update tests proving armed countdown decreases only during active top-surface support contact.
- [x] 3.3 Add regression tests proving jump-valid support and detach-frame collision exemption semantics remain intact for falling-platform detach updates.
