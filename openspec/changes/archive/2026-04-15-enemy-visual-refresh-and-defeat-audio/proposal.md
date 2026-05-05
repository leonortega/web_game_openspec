## Why

The current flying-enemy presentation reads more like a capped drone than an underside-lit ovni, which weakens the intended retro saucer silhouette during active play. The game also already supports defeat and death audio, but those interactions need stronger, more distinct identity without reopening gameplay semantics or undoing the recent defeat-readability pass.

## What Changes

- Refresh supported enemy presentation in an original retro style that sharpens silhouette identity without copying the supplied reference image.
- Shift flying-enemy accent placement toward underside lighting so hover enemies read more clearly as saucers or ovnis.
- Differentiate and strengthen enemy-defeat and player-death synthesized cues while keeping the existing synthesized audio path as the primary implementation route.
- Preserve current collision, behavior, timing, encounter authoring, defeat resolution, and respawn semantics by keeping this change presentation- and audio-only.
- Keep the recent defeat-readability work intact so refreshed enemy art and new audio cues layer onto the current bounded hold, tween, and burst presentation instead of replacing it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `enemy-hazard-system`: supported enemy visuals must refresh toward clearer original retro silhouettes, with flying enemies emphasizing underside lighting while preserving existing threat readability and fairness.
- `audio-feedback`: enemy-defeat and player-death interactions must use more distinct synthesized cues with stronger readable identity.
- `player-controller`: the existing player-death flow must emit the stronger dedicated death cue without changing damage, checkpoint, or respawn semantics.
- `retro-presentation-style`: the refreshed enemy art direction must remain original, retro-styled, readable in play, and compatible with the current defeat-readability presentation rules.

## Impact

- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/view/retroPresentation.ts`
- `src/game/simulation/GameSession.ts`
- `src/phaser/audio/SynthAudio.ts`
- Related presentation, simulation, and audio tests that cover enemy rendering, defeat routing, and player death feedback