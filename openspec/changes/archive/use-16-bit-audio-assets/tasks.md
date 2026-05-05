## 1. Asset Selection and Provenance

- [x] 1.1 Select distinct menu, `forest-ruins`, `amber-cavern`, and `sky-sanctum` tracks from `public/audio/source-packs/chillmindscapes-free-chiptune-music-pack-4`.
- [x] 1.2 Copy or convert selected music into `public/audio/music/chillmindscapes-pack-4` using web-friendly filenames and formats.
- [x] 1.3 Select stable sampled SFX files from `public/audio/source-packs/subspaceaudio-512-sound-effects-8-bit-style` for every mapped existing `AUDIO_CUES` value.
- [x] 1.4 Copy selected SFX into `public/audio/sfx/juhani-junkala-512` using stable filenames that do not depend on source-pack folder names.
- [x] 1.5 Update or add music and SFX provenance manifests with creator, license, source pack or source URL, original file names, original source-pack-relative paths, stable local asset paths, intended mappings, and per-asset volume where needed.

## 2. Runtime Manifests and Preload

- [x] 2.1 Update `src/audio/musicAssetManifest.json` so active sustained music maps only to the selected Chill Mindscapes app assets.
- [x] 2.2 Update `src/audio/musicAssets.ts` types or exports as needed for the new music manifest fields while preserving existing consumers.
- [x] 2.3 Add an SFX asset manifest/module keyed by existing `AUDIO_CUES` values without renaming cue constants in `src/audio/audioContract.ts`.
- [x] 2.4 Update `src/phaser/assets/bootAudio.ts` to preload every active sustained music asset and every mapped SFX asset from manifest data.
- [x] 2.5 Ensure no active runtime audio path points into `public/audio/source-packs`.

## 3. Sampled Playback Integration

- [x] 3.1 Update `src/phaser/audio/SynthAudio.ts` or the local audio service boundary to resolve `playCue` calls through sampled SFX mappings.
- [x] 3.2 Preserve browser unlock behavior, master volume handling, mute behavior, and no-op behavior when audio is locked, unavailable, or asset playback fails.
- [x] 3.3 Preserve existing sustained music ownership so menu and gameplay tracks stop or replace each other without overlapping scene copies.
- [x] 3.4 Keep existing cue trigger points and cadence gates for movement-heavy enemies, hazards, platforms, turret telegraphs, and other repeated sounds.
- [x] 3.5 Preserve distinct cue identities for movement, rewards, menu navigation, threat interactions, survivable damage, fatal death, capsule teleport, stage clear, and final congratulations.

## 4. Cleanup and Compatibility

- [x] 4.1 Remove active dependence on synthesized sustained-loop theme metadata, phrase templates, cadence presets, and completion-phrase authoring for menu and stage music.
- [x] 4.2 Keep any retained synthesized or authored transition behavior isolated from sustained music ownership and document why it remains if it is not replaced by a sampled asset.
- [x] 4.3 Confirm callers still use the existing `AUDIO_CUES` contract and do not need cue-name changes.

## 5. Validation

- [x] 5.1 Add or update automated checks that every active music and SFX mapping has provenance and a stable local app audio path.
- [x] 5.2 Add or update preload validation so every mapped `AUDIO_CUES` asset is preloaded before use.
- [x] 5.3 Add or update tests/playtest coverage for audio unlock safety, missing or muted audio behavior, and non-overlapping music during scene changes.
- [x] 5.4 Validate that the menu and all current playable stages use distinct Chill Mindscapes sustained music tracks.
- [x] 5.5 Validate representative sampled SFX comparisons: jump vs land, collect vs power, menu navigate vs confirm/back, hurt vs death, thruster impact vs projectile hit, capsule teleport vs stage clear/final congratulations.
