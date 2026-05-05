## Why

Current runtime and schema support enclosed gravity rooms, but authored stage content still mixes one enclosed room with several open gravity sections. This follow-up is needed to finish the rollout: every gravity-modification section in every current playable stage should use the enclosed room pattern, with stronger containment, readability, and coverage requirements so no room-local route element is cut off, unreachable, or visually ambiguous.

## What Changes

- Require every authored anti-grav stream and gravity inversion column in the current playable stages to live inside an enclosed gravity room instead of an open field section.
- Keep the enclosed-room mechanic contract from the prior change, but strengthen it so each room is fully enclosed except for one bottom entry door opening and one separate bottom exit door opening.
- Require each room to be large enough to fully contain its platforms, enemies, hazards, pickups, disable button, and intended traversal routes without cropping geometry or making interior progress unreachable.
- Define a consistent room-local visual language for this rollout: blue outlined room shell, black platforms, red enemies, and a yellow interior gravity-disable button, while preserving clear distinction from stage exits.
- Extend authored validation, tests, and playtest coverage so Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array all satisfy the full-room rollout and no open gravity modification sections remain.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: enclosed gravity room requirements now apply to every authored gravity-modification section in current playable stages, with stronger room-size, containment, and rollout rules.
- `player-controller`: enclosed gravity room controller semantics remain unchanged, but the contract now explicitly applies across the full current-stage gravity-room rollout.
- `stage-progression`: authored validation and coverage must reject current playable stages that leave any anti-grav or inversion section open, cropped, or unreachable instead of enclosed in a valid room.
- `retro-presentation-style`: enclosed gravity rooms must use one consistent readable traversal-room visual language with blue shell framing, black platforms, red enemies, and a yellow interior disable button.

## Impact

- `openspec/specs/platform-variation/spec.md`
- `openspec/specs/player-controller/spec.md`
- `openspec/specs/stage-progression/spec.md`
- `openspec/specs/retro-presentation-style/spec.md`
- `src/game/content/stages.ts`
- `src/game/content/stages.test.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/scenes/GameScene.ts`
- `scripts/stage-playtest.mjs`
- `scripts/traversal-category-visual-language-playtest.mjs`