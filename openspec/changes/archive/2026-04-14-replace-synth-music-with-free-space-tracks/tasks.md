## 1. Asset Sourcing And Manifest

- [x] 1.1 Vendor the approved menu and stage music files into the served asset tree and add a source manifest with creator, license, source URL, original archive or file name, local asset path, and intended surface mapping
- [x] 1.2 Add stable asset keys and per-track playback settings for the menu, `forest-ruins`, `amber-cavern`, and `sky-sanctum` music loops

## 2. Sustained Music Integration

- [x] 2.1 Update boot-time loading so the mapped music assets are preloaded before the menu can request playback
- [x] 2.2 Refactor sustained music ownership out of the current synthesized loop path so menu and gameplay scenes request asset-backed loops while synthesized cues and transition stingers continue to use the existing synthesized system
- [x] 2.3 Update `MenuScene`, `StageIntroScene`, `GameScene`, and `CompleteScene` to hand off or stop sustained music cleanly, preserve browser unlock behavior, and prevent overlapping active loops across scene changes
- [x] 2.4 Add fallback-safe behavior for muted, unavailable, or not-yet-unlocked audio so missing music playback does not block menus or gameplay

## 3. Validation

- [x] 3.1 Extend automated audio validation and `scripts/stage-playtest.mjs` to verify manifest-backed track mapping, correct menu and stage selection, unlock-safe startup, and single-loop ownership during scene transitions
- [x] 3.2 Run build and playtest validation and record the results for the new music pipeline