## Why

The current specs and audio direction still require sustained menu and stage music to come from the procedural synthesized system, which conflicts with the requested shift to downloaded space-themed tracks. This change explicitly replaces that requirement with a license-safe asset-backed music plan while preserving the synthesized cues and transition stingers that already support gameplay readability.

## What Changes

- Replace sustained main-menu music and stage gameplay loops with vendored free music assets instead of procedural synthesized loops.
- Adopt a CC0 or Public Domain-only sourcing policy for sustained music, with an explicit provenance manifest that records source, creator, license, original file name, local asset path, and scene or stage mapping.
- Lock the initial track mapping to the current playable surfaces: menu uses `Another space background track` by `yd`; `forest-ruins` uses `Magic Space` by `CodeManu`; `amber-cavern` uses `I swear I saw it - background track` by `yd`; `sky-sanctum` uses `Party Sector` by `Joth`.
- Keep synthesized menu interaction cues, gameplay cues, and short transition stingers for stage intro, stage clear, and final congratulations.
- Update boot-time loading, scene-to-scene music ownership, and playtest validation so asset-backed loops remain unlock-safe and do not overlap when surfaces change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-feedback`: sustained music moves from procedural synthesized loops to vendored CC0 or Public Domain music assets with explicit provenance, fixed menu and stage mapping, and updated validation expectations while synthesized cues and stingers remain in place.
- `main-menu`: the menu surface uses a designated free music asset instead of a synthesized title loop while preserving browser audio unlock and existing menu actions.
- `stage-transition-flow`: intro, clear, and final transition surfaces keep short synthesized stingers, but they no longer require motif-family continuity with a synthesized gameplay loop and must hand off cleanly to or from asset-backed music.
- `phaser-4-runtime-compatibility`: the runtime compatibility baseline changes from synthesized stage music preservation to asset-backed sustained music preservation plus the existing synthesized cue coverage.

## Impact

- Boot-time music asset loading and source-manifest plumbing
- Sustained music ownership in `src/phaser/audio/SynthAudio.ts` and the scenes that currently start or stop menu and stage music
- Scene flow in `MenuScene`, `StageIntroScene`, `GameScene`, and `CompleteScene`
- Downloaded music assets and their local packaging under the browser-served asset tree
- `scripts/stage-playtest.mjs` audio validation for unlock behavior, track mapping, and overlap prevention