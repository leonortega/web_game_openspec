## Why

The game already covers menu, transition, and gameplay music with synthesized cues, but the current compositions are still too thin to give the menu and each stage a memorable identity. A second-pass audio change is needed now to turn the existing procedural synth direction into stronger authored music with clearer hooks, phrase shape, cadence, and loop variety.

## What Changes

- Strengthen the music contract so the menu theme and each playable stage theme are authored as recognizable compositions rather than short interchangeable note loops.
- Require stage theme data to encode composition structure such as motif cells, phrase templates, cadence behavior, register ranges, bass or accompaniment rules, and anti-monotony variation instead of only sparse raw note arrays.
- Require each stage intro, gameplay loop, stage-clear cue, and final congratulations cue to relate intentionally while preserving current scene timing and browser audio-unlock behavior.
- Require the menu theme to behave like a title theme with broader phrasing, slower or more declarative harmonic arrival, and clear separation from gameplay music.
- Add validation expectations that cover comparative composition quality across the menu and every playable stage, including loop turnarounds, variation, and recognizable motif identity.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-feedback`: strengthen music-composition requirements for menu, stage intro, gameplay, completion, and validation so each stage has a recognizable motif, phrase form, cadence behavior, and loop variation within the existing synthesized audio pipeline.
- `main-menu`: require the main-menu music to function as a distinct title theme with stronger authored phrasing and separation from stage gameplay loops.
- `stage-transition-flow`: require intro, clear, and final congratulations music phrases to act as intentional extensions or closures of the current stage theme without altering scene order or duration.

## Impact

- OpenSpec contracts for synthesized music authoring, menu audio identity, and transition cue behavior.
- Likely implementation touchpoints in `src/phaser/audio/SynthAudio.ts`, `src/audio/audioContract.ts`, `src/game/content/stages.ts`, `src/game/scenes/MenuScene.ts`, `src/game/scenes/StageIntroScene.ts`, `src/game/scenes/GameScene.ts`, and `src/game/scenes/CompleteScene.ts`.
- Audio-focused regression updates for `SynthAudio.test.ts`, `GameSession.test.ts`, and `scripts/stage-playtest.mjs` to prove composition identity, clean scene handoff, and loop variation.
- Coordination with active `main-menu-simplification` and `stage-layout-safety-and-turret-telegraph` changes so music improvements do not change their scene flow, layout, or hazard-behavior scope.