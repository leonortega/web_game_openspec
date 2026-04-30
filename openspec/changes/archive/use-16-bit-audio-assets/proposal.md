## Why

The current audio plan still relies on synthesized sustained loops and synthesized gameplay/menu SFX, while downloaded 16-bit style source assets are already available for a stronger authored audio identity. This change moves music and SFX ownership to vetted sampled assets while preserving the existing audio contract, unlock behavior, volume controls, and failure tolerance.

## What Changes

- Replace sustained menu and stage music with web-friendly app assets copied or converted from `public/audio/source-packs/chillmindscapes-free-chiptune-music-pack-4`.
- Replace synthesized SFX playback for existing `AUDIO_CUES` with sampled 8-bit/16-bit style assets selected from `public/audio/source-packs/subspaceaudio-512-sound-effects-8-bit-style`.
- Keep the `AUDIO_CUES` contract stable so gameplay, menu, and transition callers do not need to change cue names.
- Preload every mapped music and SFX asset from stable app paths, not from `source-packs`.
- Preserve browser audio unlock, master volume handling, no-overlap sustained music ownership, and graceful behavior when audio is muted, unsupported, locked, or fails to load.
- Add or update provenance manifests for the selected music and SFX assets, including source pack, creator, license, original file names, stable local paths, and intended mappings.
- Remove active dependence on procedural sustained-loop authoring for menu and stage music, while retaining any synthesized path only as necessary for non-replaced transition behavior explicitly left out of the sampled mapping.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `audio-feedback`: Updates the audio requirements so sustained music uses the Chill Mindscapes chiptune pack and existing cue feedback uses sampled SubspaceAudio/Juhani Junkala assets through the stable `AUDIO_CUES` contract.

## Impact

- Affects audio manifests and loaders: `src/audio/musicAssetManifest.json`, `src/audio/musicAssets.ts`, `src/audio/audioContract.ts`, `src/phaser/assets/bootAudio.ts`, and `src/phaser/audio/SynthAudio.ts`.
- Adds stable app-served audio files under `public/audio/music/chillmindscapes-pack-4` and `public/audio/sfx/juhani-junkala-512`.
- Adds or updates provenance metadata for sustained music and sampled SFX.
- Requires validation that mapped cue assets preload, music ownership remains non-overlapping across scene changes, and gameplay remains functional if audio cannot play.
