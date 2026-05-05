# Change: music-volume-multiplier (2026-04-30)

## Summary
Make the `musicVolume` run-setting behave as a multiplier setting, while keeping `sfxVolume` as a conventional 0..1 volume. The menu UI will show both the percent (0..100) and the effective multiplier (xN). Update runtime audio code to apply the multiplier when playing sustained music (sampled assets and synthesized themes).

## Motivation
- User requested music setting to act as a multiplier (e.g., 50% -> x5) so that authors can scale music amplitude relative to each asset's base level rather than only attenuate it.
- SFX stays unchanged to preserve short-sample mixing expectations.

## Implementation
- `musicVolume` remains stored as a numeric 0..1 value (user-facing percent) but is interpreted in audio playback as a multiplier via `multiplier = musicVolume * 10`.
- Apply the multiplier when computing gain for sampled music (`scene.sound` playback) and synthesized music (`AudioContext` tones).
- Update menu UI to show `Music 50% (x5.0)` and keep step increments at 10% (0.1) which corresponds to multiplier step of +1.
- Update `formatRunSettings()` to display the multiplier in compact status strings.

## Files changed
- `src/phaser/audio/SynthAudio.ts` — apply multiplier scale to sampled and synthesized music playback (MUSIC_MULTIPLIER_SCALE = 10).
- `src/phaser/scenes/MenuScene.ts` — UI labels updated to show percent and multiplier.
- `src/game/simulation/state.ts` — `formatRunSettings()` updated to include multiplier display.

## Tasks
- [x] Update `SynthAudio` to treat `musicVolume` as multiplier (0..1 -> 0..10)
- [x] Update `MenuScene` UI labels to show percent and multiplier
- [x] Update `formatRunSettings()` and small docs
- [ ] Run build and smoke test (serve `dist/` and verify music plays and label shows correctly)
- [ ] Add brief unit test for multiplier display formatting (optional)

## Test plan
1. `npm run build` succeeds.
2. Serve `dist/` (e.g. `npx http-server ./dist -p 5174`) and start the game with `?debug=1`.
3. Open options menu and confirm music label shows both percent and xN multiplier.
4. Start a stage with sustained music and verify music loudness changes correspondingly when toggling music setting (50% ~ x5 behavior). Use the debug bridge `window.__CRYSTAL_RUN_AUDIO_DEBUG__` events to confirm music playback gain values.

## Notes
- `musicVolume` storage stays the same (0..1). Existing saves will map naturally (e.g., previously 0.7 -> x7 multiplier).
- We cap final playback gain to 1.0 to avoid exceeding the audio API's normalized gain.

---
Created by automated change process on 2026-04-30.
