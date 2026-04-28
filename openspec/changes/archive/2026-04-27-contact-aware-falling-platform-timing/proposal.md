## Why

Falling platforms currently arm on first supported contact and consume a fixed timer regardless of whether contact was a short skim, a full stay, or a later hop pattern. This creates unreadable outcomes where a jump-over skim can spend collapse time and a later safe-looking landing can fail unexpectedly.

## What Changes

- Add contact-aware falling-platform timing semantics based on explicit support-contact patterns.
- Define deterministic thresholds for stay-vs-hop classification:
- `stayArmThresholdMs = 120` ms of accumulated top-surface support contact before countdown can arm.
- `hopGapThresholdMs = 50` ms unsupported gap; gaps at or below this value preserve pre-arm accumulated stay contact, while larger gaps reset pre-arm accumulation.
- Update falling-platform countdown behavior so post-arm fall time decreases only while top-surface support contact is active.
- Preserve existing jump-from-supported falling-platform behavior and existing support-detach single-frame collision exemption behavior.
- Keep scope limited to falling platforms; brittle platform semantics remain unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: unstable/falling platforms gain deterministic contact-pattern timing (stay vs hop) instead of first-touch fixed countdown.
- `player-controller`: falling-platform support classification remains jump-valid while supported, with unchanged detach-frame collision exemption behavior.

## Impact

- `src/game/simulation/GameSession.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/game/simulation/state.test.ts`
- Falling-platform stage config definitions/builders that supply fall timing fields
