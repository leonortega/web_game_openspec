## Why

Moving platforms currently read with a darker body treatment than nearby plain safe platforms even when user wants them to inherit screenshot platform 1's full-green support look. That darker split weakens intended visual mapping between ordinary safe footing and moving support, so change should align moving-platform body treatment now while keeping assisted-movement readability markers and leaving mechanics unchanged.

## What Changes

- Update moving-platform presentation requirements so moving platforms reuse plain safe platform 1's full-green body treatment instead of screenshot platform 2's dark-body plus cool-top treatment.
- Preserve moving-platform assisted-movement readability through vertical markers or an equivalent bounded local cue, so carry behavior still reads distinctly without changing platform mechanics.
- Keep scope presentation-only: no collision, pathing, timing, authoring semantics, or stage-progression behavior changes.
- Limit validation expectations for this pass to manual in-game verification instead of adding new scripted playtest requirements.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: traversal visual-language requirements for moving platforms now require full-green safe-support body treatment while preserving assisted-movement markers and presentation-only scope.

## Impact

- OpenSpec contract in `openspec/specs/platform-variation/spec.md` for moving-platform visual identity.
- Likely apply touchpoints in `src/phaser/view/gameSceneStyling.ts` and `src/phaser/scenes/gameScene/platformRendering.ts`, plus any nearby scene or visual coverage if implementation already uses it.
- Manual in-game verification of moving-platform readability against plain safe platforms after implementation.