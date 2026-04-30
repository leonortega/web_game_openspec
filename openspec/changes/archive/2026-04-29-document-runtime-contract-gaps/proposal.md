## Why

Recent gameplay and runtime updates were implemented directly in code without a matching OpenSpec change. This left several behavior contracts implicit in implementation and tests, which increases drift risk during future refactors.

## What Changes

- Document low-gravity zones as a first-class bounded traversal mechanic alongside existing gravity-field mechanics.
- Document enclosed gravity-room deactivation-lane guardrails so button reachability remains verifiable under enemy pressure.
- Document turret visual-variant readability and bounded telegraph semantics.
- Document hopper initial-landing reachability guardrails used by authored validation.
- Document controller jump-pose hold behavior used to preserve short-lived readability after jump initiation.
- Document stage start sequence phase bounds and explicit exit-contact state handoff semantics.
- Document aggregate full-collection state (`allCoinsRecovered`) as a stage-run milestone separate from per-coin collection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: adds explicit low-gravity-zone and gravity-room deactivation-lane contracts.
- `enemy-hazard-system`: adds turret-variant telegraph readability and hopper initial-landing reachability contracts.
- `player-controller`: adds bounded jump-pose hold readability contract.
- `stage-progression`: adds explicit start-sequence phase bounds and exit-contact state semantics.
- `coin-energy-recovery`: adds aggregate full-collection stage-run state semantics.

## Impact

- Spec-only change; no gameplay code changes required in this change.
- Affected documentation surfaces:
  - `openspec/specs/platform-variation/spec.md`
  - `openspec/specs/enemy-hazard-system/spec.md`
  - `openspec/specs/player-controller/spec.md`
  - `openspec/specs/stage-progression/spec.md`
  - `openspec/specs/coin-energy-recovery/spec.md`
- Follow-up implementation work is not required because the behavior is already present; this change aligns specs to shipped behavior.