## Why

Some authored stages already define distinct sky and ground palette inputs, but the active retro backdrop treatment still hardcodes broad background bands and reuses colors that can match default platforms and other playable surfaces. That makes parts of the backdrop visually blend into the route, reducing stage readability at the exact moment the presentation pass is supposed to clarify it.

## What Changes

- Update stage-facing retro presentation requirements so authored background colors remain visually separated from playable terrain and gameplay props during active play.
- Require the backdrop treatment to derive its background bands and related atmospheric accents from stage-authored palette inputs instead of relying on the current hardcoded band mix.
- Permit a subtle secondary backdrop effect only when it increases separation between background scenery and playable space without reducing readability for hazards, player powers, HUD text, or transition text.
- Add focused verification for contrasting stage palettes so backdrop styling cannot collapse into the same visual lane as platforms or other foreground elements.

## Capabilities

### New Capabilities

### Modified Capabilities
- `retro-presentation-style`: Active stage backdrops must preserve clear foreground/background separation using stage-authored palette inputs and only optional, readability-safe secondary effects.

## Impact

- `src/phaser/view/retroPresentation.ts`
- `src/phaser/scenes/GameScene.ts`
- Potentially `src/phaser/scenes/StageIntroScene.ts` and `src/phaser/scenes/CompleteScene.ts` if they share the same stage backdrop treatment
- Playtest or regression coverage that inspects gameplay readability across authored stage palettes
- `openspec/specs/retro-presentation-style/spec.md`