## Why

Recent playtesting still exposes three quality problems in otherwise correct stage layouts: static threats can sit too close to platform corners, hopping enemies do not create enough vertical pressure, and falling platforms can drop the player out of a valid jump state too early. These issues hurt readability and control feel more than they hurt raw functionality, so they need a targeted polish pass now before more stage content is added.

## What Changes

- Tighten static hazard and turret placement so they keep meaningful distance from platform edges and favor center-biased authored positions.
- Increase hopper jump height so hopping enemies read as a stronger vertical threat.
- Refine falling-platform support logic so the player can still move and jump while contact with the falling platform surface is maintained.
- Strengthen validator coverage so edge-hugging static threats and invalid falling-platform jump behavior are caught in playtest.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `enemy-hazard-system`: changes grounded static threat placement rules so turrets and static hazards cannot be authored at or near platform corners, and hopping threats gain stronger vertical jump behavior.
- `platform-variation`: changes collapsing and falling platform behavior so supported players retain stable traversal and jump response while the platform is descending.
- `player-controller`: changes jump handling so the player can still jump while supported by a falling platform rather than losing control due to early support-state loss.

## Impact

- Affected code: [stages.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/content/stages.ts), [GameSession.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/simulation/GameSession.ts), and authored-content/playtest validation in [stage-playtest.mjs](C:/Endava/EndevLocal/Personal/web_game_openspec/scripts/stage-playtest.mjs).
- Systems affected: enemy and hazard authoring rules, hopper movement tuning, falling-platform support behavior, and automated placement/feel validation.
