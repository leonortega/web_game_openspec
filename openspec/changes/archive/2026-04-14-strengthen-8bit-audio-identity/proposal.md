## Why

The game already triggers music and sound across menus, transitions, and gameplay, but the current synth cues still read as thin placeholder beeps instead of a clear 8-bit audio identity. The user is explicitly asking for stronger retro music and sound design, so the spec needs to define perceptible style, distinct themes, and broader event coverage rather than only proving that cues exist.

## What Changes

- Strengthen the audio requirements so menu, stage intro, gameplay, and completion surfaces use clearly retro 8-bit styled synthesized music and stingers instead of generic short synth phrases.
- Require a distinct menu theme plus distinct per-stage gameplay themes and opening phrases, with a practical interpretation that each authored playable stage gets its own recognizable loop or motif within the existing synthesized audio direction.
- Expand and sharpen sound-effect requirements for player actions, moving threats and moving gameplay objects, interactive objects, power gain, death, stage completion, and menu button interactions so cues feel intentionally authored rather than interchangeable.
- Add guardrails for motion and looping cues so enemy or object movement sounds stay readable without becoming constant audio spam.
- Add validation expectations that implementation must prove perceptible 8-bit differentiation between menu, stage, transition, reward, danger, and completion audio surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-feedback`: strengthen music identity, broaden gameplay and interaction cue coverage, and require distinct 8-bit styled themes and feedback classes.
- `main-menu`: require a recognizable 8-bit menu theme and stronger retro-styled menu interaction cues without changing menu flow.
- `stage-transition-flow`: require transition intro, clear, and final-congratulations audio to present a distinct 8-bit identity while preserving existing scene timing.

## Impact

- OpenSpec contracts for audio presentation and transition behavior.
- Likely implementation touchpoints in `src/phaser/audio/`, `src/phaser/scenes/`, `src/game/content/stages.ts`, and `src/game/simulation/GameSession.ts`.
- Audio-focused regression coverage, playtest capture, and perceptual validation expectations for menu, stage, transition, reward, danger, and completion events.
- Overlap to coordinate with the active `main-menu-simplification` and `stage-layout-safety-and-turret-telegraph` changes without changing their non-audio scope.