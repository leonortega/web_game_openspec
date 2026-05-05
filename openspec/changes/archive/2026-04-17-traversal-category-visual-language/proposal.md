## Why

The game's terrain surfaces already have stronger readable identity, but most assisted movement, route-toggle, and gravity-modifier mechanics still share a generic rectangle-first presentation in play. As the traversal catalog has grown, those mechanics now need a consistent category-level visual language so players can distinguish support, activation, and gravity behavior at gameplay speed without relying on tint alone.

## What Changes

- Define a category-level visual language contract for existing traversal mechanics, grouping them into assisted movement, route toggles, and gravity modifiers.
- Require assisted-movement mechanics such as springs, launchers, moving supports, and unstable supports to read as one contact-driven family while preserving their individual identities.
- Require route-toggle mechanics such as reveal routes, temporary bridges, magnetic routes, and gravity-capsule activators to read as locally gated route states instead of generic solid rectangles.
- Require gravity modifiers such as anti-grav streams, gravity inversion columns, and enabled capsule-linked fields to read as bounded airborne acceleration spaces rather than support surfaces or launchers.
- Extend validation coverage so renderer changes keep the category mapping and local state cues stable across retries and regressions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: add readable traversal-category visual language requirements for existing assisted movement, route-toggle, and gravity-modifier mechanics.

## Impact

- `openspec/specs/platform-variation/spec.md`
- `src/phaser/scenes/GameScene.ts`
- Scene-related renderer or presentation tests covering traversal visuals
- `src/game/content/stages.test.ts` or adjacent validation coverage that asserts mechanic-to-category expectations
- Targeted scripted playtest coverage for traversal readability regressions