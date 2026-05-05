## 1. Stage Intro Presentation

- [x] 1.1 Remove the dedicated signal-bars accent path from `src/phaser/scenes/StageIntroScene.ts` without introducing a replacement intro-side motif.
- [x] 1.2 Keep the remaining intro layout, timing, and status presentation aligned with the no-accent transition contract.

## 2. Transition Validation And Playtests

- [x] 2.1 Update any stage intro debug or exported transition state so playtests no longer require `accentMode='signal-bars'` and instead accept the no-accent presentation.
- [x] 2.2 Update `scripts/capsule-exit-teleport-finish-playtest.mjs` to validate the removed intro accent behavior.

## 3. Verification

- [x] 3.1 Run the targeted transition playtest coverage needed to confirm the intro scene no longer renders signal-bars and that existing handoff timing still passes.
- [x] 3.2 Confirm no unrelated completion-scene expectations were changed while removing the intro accent.