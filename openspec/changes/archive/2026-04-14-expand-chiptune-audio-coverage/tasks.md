## 1. Synth Audio Contract

- [x] 1.1 Expand `src/phaser/audio/SynthAudio.ts` with explicit synthesized cues for menu navigation, confirm, back, fatal death, intro stinger, and completion congratulations.
- [x] 1.2 Consolidate gameplay, menu, and transition cue naming into a single typed or constant-backed contract so emitters and playback stay aligned.
- [x] 1.3 Ensure sustained music ownership is explicit for menu, gameplay, and transition scenes, with clean stop or replace behavior when scenes shut down or hand off.

## 2. Gameplay Audio Coverage

- [x] 2.1 Add any missing gameplay cue emission in `GameSession` or the gameplay scene so powers, reward interactions, fatal death, and high-value interactive objects all trigger the specified synthesized feedback.
- [x] 2.2 Keep survivable damage and fatal death semantics distinct so the death cue fires once per death event and ordinary hurt feedback remains unchanged for non-fatal hits.
- [x] 2.3 Verify stage-completion handoff preserves the existing exit cue behavior while enabling separate completion-surface congratulations audio.

## 3. Menu And Transition Integration

- [x] 3.1 Add menu-scene audio ownership for looping menu music plus navigation, confirm, and back cues on keyboard and pointer-driven interactions.
- [x] 3.2 Add unlock-on-interaction handling for menu and other non-gameplay scenes so audio starts naturally after the first eligible browser gesture without blocking input.
- [x] 3.3 Add stage-intro and completion-scene audio triggers for the intro stinger and stage-clear or final congratulatory phrase without changing existing timing semantics.

## 4. Regression Coverage And Validation

- [x] 4.1 Extend automated tests for `SynthAudio` and runtime cue emission to cover the new cue set, unlock behavior, and fatal-death semantics.
- [x] 4.2 Add regression coverage for menu audio interaction and cross-scene music handoff so menu, intro, gameplay, and completion audio do not overlap incorrectly.
- [x] 4.3 Run `npm test`, `npm run build`, and the change-scoped playtest validation focusing on menu navigation, power pickup, death, stage intro, and stage-clear audio coverage.
