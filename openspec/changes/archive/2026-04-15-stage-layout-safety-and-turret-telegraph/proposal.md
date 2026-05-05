## Why

Some authored stage layouts still allow static world elements to overlap or collide in ways that create unreadable spaces, blocked routes, or visual clutter. Separately, turret shooters are currently tied too closely to full viewport visibility, which gives the player no warning before the turret enters the screen.

## What Changes

- Add authored layout validation so static stage elements cannot overlap or interpenetrate in ways that create unintended collisions.
- Preserve intended edge-adjacent placement for static elements that are supposed to touch without sharing the same occupied space.
- Introduce a measurable pre-viewport lead margin for turret shooters so bullet visuals and firing audio can begin slightly before the turret body fully enters the camera/viewbox.
- Update regression coverage to prove both the static-layout safety rule and the turret telegraph window.

## Capabilities

### New Capabilities
- `stage-layout-safety`: authored static stage elements must remain collision-free and readable, without overlapping placements.

### Modified Capabilities
- `enemy-hazard-system`: shooter enemies may telegraph bullets and firing audio within a defined lead margin before the turret is fully visible.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/GameSession.ts`
- `scripts/stage-playtest.mjs`
- Authored stage layouts that currently rely on overlapping static placements
- Turret presentation and audio timing near the camera edge
