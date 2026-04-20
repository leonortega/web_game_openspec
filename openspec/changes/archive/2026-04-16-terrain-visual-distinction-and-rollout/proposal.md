## Why

The game already supports brittle crystal and sticky sludge terrain, but those surfaces are only weakly differentiated in play and appear too sparsely to shape stage identity or route reading. This change is needed now to make the existing terrain mechanics visually legible at a glance and to broaden their authored rollout across the main stages without expanding scope into unrelated environmental systems.

## What Changes

- Strengthen the in-stage presentation contract for `brittleCrystal` and `stickySludge` so each existing surface kind reads distinctly through bounded rectangle-based visual cues rather than relying mostly on tint and alpha alone.
- Require each main stage to author more than the current single brittle and single sticky placement so the terrain mechanics appear as deliberate route-shaping beats instead of isolated samples.
- Keep rollout stage-authored and biome-specific rather than uniform, with added surfaces placed on intended traversal sections or optional reconnecting branches.
- Extend validation and scripted coverage so authored terrain counts, placement expectations, and readability-oriented rendering cues remain regression-resistant.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: strengthen presentation and rollout requirements for authored brittle crystal and sticky sludge surfaces while keeping scope limited to those two existing terrain kinds.
- `stage-progression`: require broader main-stage authored terrain rollout and validation coverage so terrain sections remain readable, intentional, and verifiable across the campaign.

## Impact

- `openspec/specs/platform-variation/spec.md`
- `openspec/specs/stage-progression/spec.md`
- `src/game/content/stages.ts`
- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.test.ts`
- `scripts/stage-playtest.mjs`