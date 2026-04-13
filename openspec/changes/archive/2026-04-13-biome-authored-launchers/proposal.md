## Why

Current spring platforms cover only one authored launch surface pattern, which makes biome-specific traversal beats collapse into the same data shape, runtime logic, and presentation. The game needs bounded organic bounce pods and gas vents as distinct contact launchers so stages can author alien-biome lift moments without introducing continuous lift fields or breaking the existing impulse-first controller contract.

## What Changes

- Add two authored launcher kinds, `bouncePod` and `gasVent`, as contact-triggered launch surfaces distinct from existing spring platforms.
- Define the shared launcher contract: first-contact trigger timing, upward-biased optional directional authoring, readiness and cooldown rules, jump-hold suppression, and non-field behavior.
- Define how launcher impulses compose with low gravity, sticky sludge, dash, buffered jump, coyote time, and coexistence with springs.
- Add authored-data validation, reset expectations, automated regression coverage, and scripted playtest coverage for launcher routes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `platform-variation`: add biome-authored bounce pod and gas vent launchers as bounded traversal surfaces and stage-identity route tools.
- `player-controller`: extend the impulse-first controller contract to cover launcher timing, suppression, and composition with low gravity, sticky sludge, dash, and jump forgiveness.
- `stage-progression`: validate launcher authoring separately from springs and require launcher fixture and playtest coverage, including reset behavior across attempts.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/audio/SynthAudio.ts`
- `scripts/stage-playtest.mjs`
- Authored stage layouts that currently rely on springs for all launch behavior