## Why

The stage toolkit can already author reveal routes, temporary bridges, and other bounded traversal variants, but it cannot yet author a simple powered platform that switches between non-supporting and solid states through a nearby activation pattern. This change adds the narrowest useful version of magnetic traversal now so stages can gate an optional route with readable powered-solidity rules, while explicitly deferring polarity, attraction forces, and any broader traversal-system rewrite.

## What Changes

- Add one authored magnetic platform variant that behaves as floor-like support only and toggles between non-solid and solid states based on linked activation-node power state.
- Add one nearby authored activation-node pattern that uses existing proximity or contact-style activation semantics to power linked magnetic platforms without adding a general node graph or new interact family.
- Define readability and safety rules for powered magnetic platforms, including top-surface-only support, visible powered versus unpowered presentation, and safe fallback route expectations.
- Define attempt and checkpoint reset behavior so activation-node and magnetic-platform runtime state remains deterministic across death, respawn, restart, and fresh attempts.
- Explicitly defer polarity behavior, attraction or repulsion forces, wall or ceiling traversal, and multi-stage or multi-node system generalization.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: stages gain a bounded activation-node-powered magnetic platform variant with binary powered solidity and explicit readability rules.
- `stage-progression`: activation-node and magnetic-platform runtime state gains reset and checkpoint-behavior requirements for fresh attempts and respawns.

## Impact

- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/content/stages.test.ts`
- `scripts/stage-playtest.mjs`
- Authored stage layouts that place activation nodes and linked magnetic platforms