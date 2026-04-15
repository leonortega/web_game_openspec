## 1. Audio Cleanup

- [x] 1.1 Remove obsolete synthesized sustained-loop metadata, validation assumptions, and contract branches while preserving synthesized cues and transition stingers
- [x] 1.2 Keep menu and stage sustained music mapped only through the current asset-backed music manifest, contract types, and scene ownership paths
- [x] 1.3 Update audio tests and playtest coverage to assert clean asset-backed loop ownership and preserved synthesized cue or stinger behavior

## 2. Shared Motion And FX Foundations

- [x] 2.1 Add shared animation registration or state selection for player and enemy presentation that supports bounded retro pose changes without changing gameplay timing
- [x] 2.2 Add shared tween and particle presets for jumps, checkpoints, coin pickup, full-coin recovery, and power acquisition with readability-safe counts and durations
- [x] 2.3 Thread event-based feedback hooks from gameplay and transition state into the new shared motion or FX layer without introducing per-frame spam

## 3. Gameplay Presentation Integration

- [x] 3.1 Apply the new retro animation states to the base player and supported power variants for grounded, moving, and airborne readability
- [x] 3.2 Apply readable enemy or hazard telegraph and motion animation that stays deterministic with existing attack or movement states
- [x] 3.3 Apply bounded jump, checkpoint, coin, full-clear, and power-gain feedback in the gameplay view while preserving checkpoint and respawn semantics

## 4. Transition Presentation And Validation

- [x] 4.1 Add sparse intro and completion pose or accent animation that preserves current scene duration, ordering, and audio handoff behavior
- [x] 4.2 Extend unit, integration, and playtest validation to cover sustained-music cleanup, event-triggered motion feedback, and timing-safe transition animation
- [x] 4.3 Run the relevant automated checks and playtest flow, then record the results for this change