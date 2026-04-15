## Why

The current synthesized audio pass covers only part of gameplay, leaving menu navigation, stage intro, death, power pickup, and end-of-stage celebration moments without consistent chiptune feedback. Expanding coverage now will make core interactions and scene transitions feel more readable and complete while reusing the existing procedural audio approach instead of introducing asset-heavy audio content.

## What Changes

- Extend synthesized sound coverage so the player, enemies, hazards, interactive objects, powers, death, and stage-completion moments all have explicit audio expectations.
- Add menu-facing chiptune audio behavior, including root and submenu button navigation cues plus menu music that respects browser audio-unlock limits.
- Add transition-facing music cues for stage intro and stage-clear scenes, including a short start stinger and a congratulatory completion cue that remain manageable across scene changes.
- Define practical audio lifecycle rules so gameplay, menu, and transition scenes can start, stop, or defer music without overlapping incorrectly or breaking when audio is muted or locked.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `audio-feedback`: Expand synthesized music and sound requirements to cover menu, transition, death, power, interactive-object, and completion events with explicit cue semantics and graceful unlock behavior.
- `main-menu`: Require audible menu navigation feedback and title/menu music behavior that works with the shared synthesized audio system and browser gesture restrictions.
- `stage-transition-flow`: Require intro and post-clear transition surfaces to trigger the appropriate synthesized music or stinger cues without changing existing scene flow timing semantics.

## Impact

- Affects synthesized audio orchestration centered on `src/phaser/audio/SynthAudio.ts` and the scene/runtime call sites that already trigger gameplay music and cues.
- Affects `GameScene`, menu/transition scene lifecycle, and bridge-level scene coordination so music and one-shot cues do not overlap or restart incorrectly.
- Affects gameplay event coverage for enemies, powers, pickups, hazards, death, and stage completion, plus menu button cue contracts.
- Affects validation and playtest coverage for browser audio unlock behavior, scene-to-scene music switching, and complete synthesized cue coverage for high-value events.
