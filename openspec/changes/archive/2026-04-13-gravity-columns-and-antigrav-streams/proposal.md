## Why

The current traversal toolkit can stretch airborne arcs with broad low-gravity zones, but it cannot author tighter vertical field variants that create readable climb and drift beats in a single sky section without broadening gravity into a systemic rewrite. This change adds two bounded rectangular gravity-field variants now so Halo Spire Array can introduce a focused high-air traversal setpiece while keeping the controller's impulse-first behavior and the game's stage-authored platformer rules intact.

## What Changes

- Add authored gravity inversion columns that act as bounded rectangular fields and reverse the player's ongoing airborne vertical acceleration while inside the field.
- Add authored anti-grav streams that act as bounded rectangular fields and reduce or counter downward airborne vertical acceleration to create slower drift-style ascent or descent control inside the field.
- Define controller ordering so jumps, double jumps, dash, springs, launchers, sticky sludge, and falling-platform escape continue to resolve their normal impulses before either field variant adjusts subsequent airborne acceleration.
- Keep the mechanic player-only, stage-authored, and centered on the Halo Spire Array sky section rather than broadening it into generalized directional physics or multi-stage rollout.
- Define attempt and checkpoint reset expectations for authored gravity fields so stage validation and respawn behavior remain deterministic.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-controller`: define how gravity inversion columns and anti-grav streams alter airborne vertical acceleration without replacing existing jump, dash, launcher, sludge, or falling-platform support rules.
- `platform-variation`: add two bounded authored gravity-field traversal variants that remain distinct from low-gravity zones, launchers, and generalized lift mechanics.
- `stage-progression`: define authored validation and respawn-reset expectations for gravity-field traversal state so fresh attempts and checkpoint restores remain readable and consistent.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/state.ts`
- `src/phaser/scenes/GameScene.ts`
- `scripts/stage-playtest.mjs`
- `src/game/simulation/GameSession.test.ts`
- `src/game/simulation/state.test.ts`
- Halo Spire Array authored stage layout and related validation coverage