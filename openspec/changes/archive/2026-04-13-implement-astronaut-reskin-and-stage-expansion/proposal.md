## Why

The current build already supports long-form stages, fixed powers, and authored terrain variation, but its presentation is still anchored to the earlier fantasy-themed naming and visual framing. The next change should convert that experience into a clear astronaut-on-an-alien-world theme while using the existing engine, stage authoring model, and power systems instead of introducing new traversal or combat rules.

## What Changes

- Retheme the player, stage naming, palette direction, HUD copy, and menu or transition presentation around an astronaut exploring alien-planet biomes.
- Rename the four existing player-facing powers with astronaut-themed display names while preserving the current mechanics and fixed power set.
- Expand the three authored stages with more playable segments, optional detours, and high-air traversal routes that stay within the current authored content system.
- Rebalance enemy spacing and encounter density so the longer routes stay readable, with optional branches allowed to carry higher pressure than the critical path.
- Update help and transition surfaces so stage identity, power identity, and progression messaging consistently use the new presentation layer.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stage-progression`: main stages gain more authored playable space, optional detours, and elevated alternate routes while preserving the current start-to-exit structure.
- `platform-variation`: traversal variety and platform usage reinforce the alien-biome identity and support authored high-air routes without adding new movement physics.
- `interactive-blocks`: the existing four powers keep their mechanics but gain astronaut-themed player-facing naming.
- `enemy-hazard-system`: enemy spacing and encounter density are retuned for more readable authored pressure across main and optional routes.
- `player-power-visual-variants`: the player base look and power variants shift to astronaut-themed presentation.
- `gameplay-hud`: stage and power labels reflect the new authored display names during active play.
- `stage-transition-flow`: pre-stage and post-stage screens present stage identity and power identity using the astronaut or alien-world framing.
- `main-menu`: menu and help text reflect the new theme while keeping the existing flow and controls.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/scenes/StageIntroScene.ts`
- `src/phaser/scenes/MenuScene.ts`
- `src/phaser/sceneBridge.ts`
- `ui/hud/`
- Authored stage data, presentation metadata, and content validation or playtest coverage for longer routes and encounter readability