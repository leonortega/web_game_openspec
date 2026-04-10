## Why

Power pickups can still become unusable if the only way to continue after a block reveal is to touch a non-stompable hazard enemy, which immediately removes the new power. This change tightens the authored safety contract so reward blocks cannot create unavoidable contact traps after pickup.

## What Changes

- Tighten authored reward-block validation so power pickups cannot force an unavoidable post-pickup collision with any blocking enemy type.
- Extend the stage-flow rule so the route after collecting a power remains safely traversable without requiring immediate enemy contact.
- Add regression coverage for the unsafe hazard-enemy trap and for a safe nearby layout that still allows clean continuation.
- Update affected stage content where power blocks currently sit on routes that can only be continued by taking enemy damage.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `interactive-blocks`: power blocks must not create a forced-contact continuation route against stompable enemies or non-stompable hazard enemies immediately after pickup.
- `stage-progression`: authored stage routes after collecting a power must remain safely traversable and must not require immediate enemy contact to continue.

## Impact

Affects stage authoring validation, stage content placement, `scripts/stage-playtest.mjs` verification coverage, and the spec contracts that govern safe reward-block placement and post-pickup progression.
