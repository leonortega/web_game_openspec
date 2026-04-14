## 1. Shared Presentation Contract

- [x] 1.1 Extend the shared retro presentation helpers and tokens for the harsher second-pass palette quantization and sprite-like motion limits without adding simulation-affecting state or timing changes.
- [x] 1.2 Apply the shared retro presentation contract to `MenuScene` and any needed shell styling so the menu is restyled without changing menu actions, help behavior, or current layout-flow decisions.

## 2. Gameplay-Facing Scene Tightening

- [x] 2.1 Tighten `GameScene` and `hud.ts` visuals to the harsher retro pass while preserving readable stage, collectible, health, and power information on the existing gameplay update cadence.
- [x] 2.2 Tighten `StageIntroScene` and `CompleteScene` visuals to the same retro pass while preserving existing scene order, progression meaning, and timing semantics.
- [x] 2.3 Update player power, enemy, hazard, and telegraph presentation so they remain readable under the tighter quantized pass without changing mechanics, cadence, or authored encounters.

## 3. Regression Coverage

- [x] 3.1 Update `scripts/stage-playtest.mjs` to verify the retro-styled menu presentation still preserves settings changes, help access, and start flow.
- [x] 3.2 Verify the second-pass tightening remains presentation-only by checking gameplay timing, transition cadence, and authored content/state behavior stay unchanged.