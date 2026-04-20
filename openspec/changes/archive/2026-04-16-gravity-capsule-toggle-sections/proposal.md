## Why

Authored gravity fields currently read as always-on translucent rectangles, which limits route shaping and makes the mechanic feel less like a deliberate stage section than other bounded traversal tools in the repo. This change adds the narrowest useful gated version of those fields so stages can author contained gravity-capsule sections with clear cause-and-effect activation, while keeping the mechanic distinct from the stage-completion capsule and avoiding a broader trigger-puzzle system.

## What Changes

- Add authored gravity capsule sections that wrap an anti-grav stream or gravity inversion column inside a visible shell with contained route geometry instead of leaving the field as an open always-on rectangle.
- Add one nearby activation-button pattern for these sections: stepping on or contacting the authored button powers its linked gravity capsule section on the same update and keeps that section enabled until a reset event.
- Extend gravity-field requirements so enabled sections affect only the player while airborne, stay bounded to their authored capsule footprint, and remain off until their linked button is triggered.
- Add route-containment and validation rules so authored capsule sections include readable internal traversal geometry, do not strand the player when disabled, and remain distinguishable from stage-exit capsules.
- Add presentation requirements for dormant versus enabled capsule sections, including readable shell, door, and button states that stay local and retro-styled without being confused with the completion endpoint.
- Explicitly defer toggle-off timers, multi-button logic, chained trigger puzzles, projectile activation, and any general-purpose activation framework.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-controller`: authored anti-grav and gravity-inversion fields gain enabled-state gating so they affect airborne motion only while their linked capsule section is active.
- `stage-progression`: authored stage validation gains gravity-capsule route-containment and reachable-button rules so these sections remain safe, readable, and on intended routes.
- `platform-variation`: bounded gravity-field traversal expands to support button-activated capsule sections with latched enabled state, capsule-contained route rules, and reset behavior.
- `retro-presentation-style`: gravity capsule shells, doors, and activation buttons gain local retro presentation rules that distinguish dormant versus enabled states without reading like the stage-completion capsule.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.test.ts`
- `scripts/stage-playtest.mjs`
- Authored stage layouts that place gravity capsule shells, linked buttons, and contained route geometry