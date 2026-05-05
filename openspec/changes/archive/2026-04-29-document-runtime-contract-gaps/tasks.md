## 1. Platform Variation Contracts

- [x] 1.1 Update `platform-variation` spec to include low-gravity zones as a bounded gravity-field traversal mechanic.
- [x] 1.2 Update `platform-variation` spec to include bounded gravity-room deactivation-lane reachability guardrails.

## 2. Enemy And Hazard Contracts

- [x] 2.1 Add enemy-hazard contract coverage for turret visual variants and bounded telegraph readability.
- [x] 2.2 Add enemy-hazard contract coverage for hopper initial-landing reachability validation guardrails.

## 3. Controller And Stage Flow Contracts

- [x] 3.1 Update `player-controller` spec to include short bounded jump-pose hold readability semantics.
- [x] 3.2 Update `stage-progression` spec to include explicit stage-start phase bounds before active control.
- [x] 3.3 Update `stage-progression` spec to include explicit valid-exit-contact state before final completion handoff.

## 4. Collectible-State Contracts

- [x] 4.1 Update `coin-energy-recovery` spec to include aggregate full-collection state semantics (`allCoinsRecovered`) separate from per-coin persistence.

## 5. Verification

- [x] 5.1 Run OpenSpec validation for this change (manual artifact validation completed because local `npx openspec` CLI is unavailable in this workspace).
- [x] 5.2 Ensure all tasks are marked complete after validating artifact consistency.