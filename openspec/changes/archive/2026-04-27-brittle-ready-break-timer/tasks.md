## 1. Runtime Final-Transition Timer

- [x] 1.1 Extend brittle runtime state/config in src/game/simulation/state.ts to track `readyBreakDelayMs` and ready-state elapsed/remaining time without changing warning-phase accumulation rules.
- [x] 1.2 Update brittle progression in src/game/simulation/GameSession.ts so `readyToBreak` starts a 220 ms timer on warning completion and transitions to broken when timer expires, independent of player leave/contact.
- [x] 1.3 Preserve ready-state support semantics until expiry: while timer remains, brittle must stay solid/landable and permit grounded jump initiation, including re-landing from adjacent platform jumps.

## 2. Non-Regression Guardrails

- [x] 2.1 Keep brittle warning progression and reset behavior before `readyToBreak` unchanged (including existing hop-gap handling semantics).
- [x] 2.2 Keep falling-platform contact-aware behavior (`stayArmThresholdMs`, `hopGapThresholdMs`, contact-gated armed countdown) unchanged.

## 3. Automated Coverage

- [x] 3.1 Add or update src/game/simulation/GameSession.test.ts for ready-timer semantics:
- [x] 3.1.1 ready timer starts exactly when brittle warning reaches completion.
- [x] 3.1.2 ready timer continues decreasing even while player remains supported.
- [x] 3.1.3 brittle breaks on timer expiry without requiring leave input.
- [x] 3.1.4 ready state remains solid/landable before expiry, including landing onto ready brittle from another platform and immediately jumping.
- [x] 3.2 Add or update regression tests proving warning-phase progression/reset behavior is unchanged.
- [x] 3.3 Add or update regression tests proving falling-platform semantics remain unchanged.
- [x] 3.4 Run npm test and npm run build; record results in change notes.

## Validation Notes

- `npm test` (vitest): pass, 15 files / 248 tests.
- `npm run build` (`tsc --noEmit && vite build`): pass.
