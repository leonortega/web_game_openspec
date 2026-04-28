## Why

Current brittle behavior waits for a leave event after readiness, so fully warned brittle can remain indefinitely if player never leaves top-surface support. User requirement says brittle must still progress to broken by time, not only by jump or leave.

At same time, last pre-break state must remain real support: player should still be able to stand, land from nearby platforms, and jump from it until break moment.

## Explore Handoff

- Keep existing brittle warning progression semantics as-is unless required by final-transition timer.
- Change only final brittle transition (`ready -> broken`) to be time-based.
- Keep falling-platform behavior unchanged.
- Preserve player-readable support in last pre-break state, including landability from adjacent platform jumps.

## What Changes

- Replace brittle break trigger from leave-transition-only to timed ready-window trigger.
- Define deterministic final-transition timer semantics:
- A brittle platform enters `readyToBreak` when warning progression reaches full duration.
- On that same update, start `readyBreakDelayMs = 220` ms countdown.
- While `readyToBreak` countdown remaining time is greater than zero, brittle stays solid/landable and supports normal grounded movement and jump initiation.
- `readyToBreak` countdown decreases every simulation update regardless of support occupancy.
- On first update where `readyToBreak` elapsed time reaches or exceeds `readyBreakDelayMs`, brittle transitions to broken/falling even if player is still supported.
- Keep brittle warning accumulation and reset semantics before `readyToBreak` unchanged.
- Keep falling-platform contact-aware thresholds and timing semantics unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- platform-variation: brittle final transition uses deterministic ready-state timer while preserving pre-break support behavior.

## Impact

- src/game/simulation/state.ts
- src/game/simulation/GameSession.ts
- src/game/simulation/state.test.ts
- src/game/simulation/GameSession.test.ts
- src/phaser/scenes/GameScene.ts (only if visual timing hooks require ready-timer read updates)
