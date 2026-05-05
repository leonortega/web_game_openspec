## Context

The project already has an asset-backed sustained music path with manifest-driven preload and scene ownership, plus a stable `AUDIO_CUES` contract used by menu, gameplay, transition, and reward systems. The requested change shifts the audio identity to downloaded 16-bit style assets: music from `public/audio/source-packs/chillmindscapes-free-chiptune-music-pack-4` and SFX from `public/audio/source-packs/subspaceaudio-512-sound-effects-8-bit-style`.

The implementation must keep source-pack folders as provenance inputs only. Runtime audio should load from stable app-served folders such as `public/audio/music/chillmindscapes-pack-4` and `public/audio/sfx/juhani-junkala-512`, with checked-in manifests explaining which source files became active app assets.

## Goals / Non-Goals

**Goals:**

- Replace active menu and stage sustained music with selected Chill Mindscapes pack tracks served from the app audio folder.
- Replace synthesized implementations of existing `AUDIO_CUES` with selected Juhani Junkala sampled SFX while keeping cue identifiers stable.
- Preload every mapped music and SFX asset during boot through manifest-derived configuration.
- Preserve browser unlock, master volume, no-overlap music ownership, and graceful audio failure behavior.
- Add provenance records for every active music and SFX mapping.
- Keep scene and gameplay callers stable by adapting audio internals, not by renaming cue events.

**Non-Goals:**

- Adding new cue names or changing gameplay event trigger points.
- Loading runtime audio directly from `public/audio/source-packs`.
- Reworking unrelated scene timing, collision, reward, or menu logic.
- Introducing an external audio middleware dependency.

## Decisions

1. Use stable app asset folders instead of loading from source packs.

   Source-pack directories are large, awkwardly named, and intended as raw inputs. The implementation should copy or convert selected music into `public/audio/music/chillmindscapes-pack-4` and selected SFX into `public/audio/sfx/juhani-junkala-512`, then reference only those paths from manifests. Alternative considered: load source-pack files directly. That was rejected because it couples runtime paths to archive layout and makes future cleanup or conversion risky.

2. Extend the manifest approach to SFX.

   Music already has manifest-driven active mappings and provenance. SFX should follow the same pattern with a manifest keyed by existing `AUDIO_CUES` values, including creator, license, source pack, original relative file name, local asset path, cue mapping, and volume. Alternative considered: hard-code cue-to-file maps in `SynthAudio.ts`. That was rejected because provenance and preload coverage would be harder to audit.

3. Keep `AUDIO_CUES` as the public cue contract.

   Callers should continue to emit `jump`, `menu-confirm`, `capsule-teleport`, `final-congrats`, and the rest of the existing cue names. Internally, cue playback can resolve those keys to sampled assets. Alternative considered: add new cue names for sampled files. That was rejected because it expands call-site churn without changing game behavior.

4. Replace sustained music independently from short cues.

   Sustained menu/stage tracks remain owned by the existing music ownership path, while SFX are one-shot or cadence-gated short sounds. Scene handoffs should continue to stop or replace sustained music before starting another loop. Alternative considered: play music through the same cue path as SFX. That was rejected because sustained loops require ownership, stop/restart, and no-overlap semantics that one-shot cues do not.

5. Maintain graceful failure by treating missing audio as non-blocking.

   Asset load failures, locked browser audio, muted volume, unsupported formats, or missing cue mappings must not throw through gameplay/menu flows. The sampled implementation should no-op or skip unavailable sounds the same way the current audio system tolerates unavailable audio. Alternative considered: fail hard when a mapped file is missing. That was rejected because audio is supportive feedback, not a gameplay dependency.

## Risks / Trade-offs

- Selected WAV files may increase bundle size or decode cost -> Copy only active cue files into stable app folders, prefer web-friendly formats for music, and avoid vendoring unused SFX into runtime folders.
- Some sampled cues may feel less distinct than synthesized cues -> Choose stable one-file mappings by cue category and verify key comparisons: jump vs land, hurt vs death, stomp vs shoot-hit, pickup vs power, menu move vs confirm/back.
- SFX replacement could accidentally bypass cadence gates for motion-heavy sounds -> Keep existing cue trigger gating and only swap the playback implementation.
- Browser support may vary by format -> Use formats Phaser/browser support consistently in the current app; convert Chill Mindscapes WAV music to web-friendly files when appropriate.
- Manifest drift can leave unpreloaded assets -> Derive boot preload lists from active music and SFX manifests and add validation that every mapped cue path is present.
