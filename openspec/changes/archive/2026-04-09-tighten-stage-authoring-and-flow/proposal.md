## Why

Recent playtesting still shows authored-content quality issues that break readability and trust in the stage layout. Amber Cavern still contains hazards that look unsupported, grounded enemies can hover or clip because their spawn and movement are not tied tightly to platform tops, and the current stage flow drops directly into gameplay without a short status presentation or automatic post-clear transition.

## What Changes

- Tighten authored hazard placement so non-pit hazards are visibly anchored to reachable floor or platform surfaces, with a focused cleanup pass for Amber Cavern and validation rules that catch similar issues across all stages.
- Tighten grounded enemy authoring and runtime behavior so walkers, hoppers, chargers, and turrets spawn on platform tops and stay within valid platform limits; only flying enemies remain free-lane threats.
- Add a stage transition flow with a short pre-stage presentation screen that shows player status before gameplay begins.
- Update the post-clear flow so a stage results screen appears, shows player stats, and then advances automatically to the next stage when applicable.
- Strengthen the authored-content validator and playtest coverage so unsupported hazards, off-platform enemy placement, and invalid patrol spans fail validation instead of passing permissive checks.

## Capabilities

### New Capabilities
- `stage-transition-flow`: Defines pre-stage presentation screens and post-clear results flow, including timed transitions into gameplay and to the next stage.

### Modified Capabilities
- `stage-progression`: Changes stage entry and completion requirements to include a pre-play presentation step and timed continuation after stage clear.
- `enemy-hazard-system`: Changes authored threat requirements so grounded enemies and non-pit hazards must be anchored to reachable supporting terrain and grounded movement lanes.

## Impact

- Affected code: [stages.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/content/stages.ts), [GameSession.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/game/simulation/GameSession.ts), [GameScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/GameScene.ts), [MenuScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/MenuScene.ts), [CompleteScene.ts](C:/Endava/EndevLocal/Personal/web_game_openspec/src/phaser/scenes/CompleteScene.ts), and new transition scene code.
- Validation and QA: [stage-playtest.mjs](C:/Endava/EndevLocal/Personal/web_game_openspec/scripts/stage-playtest.mjs) will need stricter authored-content checks and flow verification.
- Systems affected: stage authoring rules, enemy grounding behavior, scene flow, and automated content validation.
