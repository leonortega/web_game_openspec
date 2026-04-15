## Why

The repo has already shifted sustained menu and stage music to asset-backed tracks, but obsolete synthesized sustained-loop authoring assumptions still linger in validation and audio-facing contracts. At the same time, core gameplay actors and reward moments still read as mostly static shapes, so the requested retro polish needs a clear motion and feedback contract before implementation work starts.

## What Changes

- Remove the remaining synthesized sustained-loop authoring and validation expectations for menu and stage music while preserving synthesized interaction cues, gameplay cues, and transition stingers.
- Add a bounded retro animation pass for the player and enemies so movement, airborne state, telegraph state, and power state read through deliberate low-frame pose changes instead of mostly static geometry.
- Add event-driven particles and short feedback animation for jump actions, checkpoint activation, coin collection, full-coin recovery, and power acquisition.
- Extend stage intro and completion surfaces with sparse pose and accent animation that stays consistent with current scene timing and audio handoff rules.
- Define validation expectations for the music cleanup and new motion feedback so implementation can prove readability-safe behavior instead of ad hoc polish.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `audio-feedback`: sustained music cleanup removes obsolete synthesized loop authoring remnants while preserving synthesized cues and transition stingers.
- `player-power-visual-variants`: player base and power variants gain bounded retro animation and power-gain feedback states that stay readable at gameplay scale.
- `enemy-hazard-system`: enemy and hazard visuals gain readable motion and telegraph animation rules without changing timing or fairness.
- `coin-energy-recovery`: research-sample collection and full-clear recovery gain bounded celebratory feedback that remains checkpoint-safe.
- `player-controller`: controller-driven jump, landing, and checkpoint moments expose readable event-based visual feedback without changing movement behavior.
- `stage-transition-flow`: intro and completion surfaces gain sparse retro pose and accent animation while preserving scene timing and audio handoff behavior.
- `retro-presentation-style`: the shared retro direction now defines how short-lived particles, tweens, and low-frame animation remain secondary to route readability.

## Impact

- OpenSpec contracts for audio cleanup, gameplay-facing animation, reward feedback, and transition presentation.
- Likely implementation touchpoints in `src/phaser/audio/`, `src/audio/`, `src/phaser/scenes/`, `src/game/simulation/state.ts`, `src/phaser/view/retroPresentation.ts`, and related tests.
- Validation updates in `src/phaser/audio/SynthAudio.test.ts`, `src/game/content/stages.test.ts`, and `scripts/stage-playtest.mjs` to cover sustained-music cleanup and motion feedback triggers.
- Coordination with the current asset-backed music direction so this change does not reintroduce synthesized sustained loops.