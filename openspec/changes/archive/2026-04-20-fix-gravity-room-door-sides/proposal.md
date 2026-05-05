## Why

The enclosed gravity-room rollout now blocks shell-band trespass and requires usable door footing, but it still does not define which side of each bottom door must remain reachable. That gap allows authored rooms to pass validation even when the entry door is only approachable from the room interior or the exit door reconnects on the wrong side, so this follow-up needs to make side-aware door access explicit before more room variants build on the same contract.

## What Changes

- Clarify enclosed gravity-room door semantics so bottom entry doors require a reachable exterior-side approach path into the room.
- Clarify enclosed gravity-room door semantics so bottom exit doors require a reachable interior-side route through the room and a usable reconnect on the exterior exit side after leaving the room.
- Extend authored validation to reject gravity rooms whose door support or route connectivity satisfies the previous generic footing rule but fails the intended entry-side or exit-side access contract.
- Re-author the affected gravity-room stage data in the current bounded-room model so the four identified rooms satisfy the side-aware door rules without changing the broader runtime shell model.
- Add or update automated coverage for side-aware door validation and the affected room layouts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-variation`: enclosed gravity-room requirements now define door access by side, including exterior-side entry approach and interior-to-exterior exit reconnect expectations within the bounded-room model.
- `stage-progression`: enclosed gravity-room validation now rejects rooms whose entry or exit doors lack the correct-side reachable path even if generic door footing exists.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`.
- Expected implementation areas: `src/game/content/stages/validation.ts`, `src/game/content/stages/builders.ts`, `src/game/content/stages/catalog.ts`, and `src/game/content/stages.test.ts`.
- Expected authored stage-data changes: `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule`.
- Runtime shell blocking remains in scope only as existing behavior to preserve; this change is primarily validation tightening plus room re-authoring.