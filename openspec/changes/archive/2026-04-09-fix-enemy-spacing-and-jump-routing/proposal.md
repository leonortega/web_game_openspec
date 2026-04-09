## Why

Enemy placement and hopper movement are producing unreliable encounters. Turrets can end up too close to hazards or other grounded enemies, and hopper enemies currently jump on a timer without reasoning about a safe landing platform. This change makes mixed encounters readable and keeps hopping enemies on intended traversal lines.

## What Changes

- Reposition shooting enemies in authored stages when they conflict with nearby hazards or grounded enemies.
- Add runtime placement validation or adjustment so new stages do not introduce overlapping turret/hazard layouts.
- Upgrade hopper enemies so they select a reachable platform target before jumping and only jump when the gap is within their actual movement envelope.
- Preserve consistent encounter readability by keeping enemy spacing intentional in both current content and future stages.

## Capabilities

### New Capabilities


### Modified Capabilities
- `enemy-hazard-system`: Add enemy-enemy spacing rules, turret repositioning expectations, and hop-to-platform routing behavior.

## Impact

- Affects authored stage data in `src/game/content/stages.ts`.
- Affects runtime enemy placement and movement in `src/game/simulation/GameSession.ts`.
- Affects enemy and platform state shape if hopper routing needs extra bookkeeping in `src/game/simulation/state.ts`.
- Affects playtest validation through `scripts/stage-playtest.mjs` or equivalent manual verification flow.
