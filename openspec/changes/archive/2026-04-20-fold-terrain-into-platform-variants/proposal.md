## Why

Stages currently author brittle crystal and sticky sludge as partial `terrainSurfaces` overlays attached to static platforms. That model makes renderer, validation, and runtime treat traversal modifiers as a second overlay system instead of as a property of the platform itself. This change folds both terrain types into full-platform variants so authored data, rendering, and simulation use one cleaner platform model while preserving brittle collapse behavior and sticky grounded drag.

## What Changes

- Remove separate authored `terrainSurfaces` overlays for brittle and sticky traversal content and replace them with full-platform variants authored directly on supported platforms.
- Define `brittleCrystal` and `stickySludge` as full-footprint platform variants that apply to the entire authored platform shape rather than to partial overlay rectangles.
- Keep brittle behavior as readable delayed-collapse support on first top-surface use, but remove sticky terrain jump coupling so sticky only changes grounded acceleration and grounded top speed.
- Bound brittle and sticky platform variants to static platforms unless a later change explicitly broadens that contract.
- Migrate validation, runtime state, rendering, tests, playtest scripts, and existing stage-authored data away from the overlay system and onto platform variants.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: replace partial terrain-surface overlays with full-platform brittle and sticky variants and define their bounded authoring rules.
- `player-controller`: remove sticky terrain jump-impulse coupling while preserving sticky grounded drag behavior.
- `stage-progression`: require validation and regression coverage for migrated authored platform-variant data and reject legacy overlay authoring.
- `retro-presentation-style`: require brittle and sticky presentation cues to cover the full authored platform footprint and remain readable in motion.

## Impact

- `src/game/content/stages/types.ts`
- `src/game/content/stages/builders.ts`
- `src/game/content/stages/catalog.ts`
- `src/game/content/stages/validation.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/gameScene/bootstrap.ts`
- `src/phaser/scenes/gameScene/platformRendering.ts`
- Stage fixtures, validation tests, runtime tests, and playtest scripts that currently assume `terrainSurfaces` overlays