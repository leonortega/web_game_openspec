## Why

Collectible and checkpoint fiction is currently inconsistent across the HUD, stage messages, and transition screens, which makes the run feel less intentional and exposes mechanic-oriented terms in some surfaces while other screens use different language. The change is needed now to establish one coherent presentation layer before more player-facing copy builds on the current mismatch.

## What Changes

- Re-theme player-facing collectible language to `research sample` / `research samples` across active-play HUD copy, stage messaging, and transition screens while preserving the existing coin-based progression logic underneath.
- Re-theme player-facing checkpoint language to `survey beacon` / `survey beacons` across gameplay and transition surfaces while preserving the existing checkpoint activation, respawn, and persistence rules.
- Define a presentation-layer naming contract so stage-local and run-total collectible counts both use the same noun family (`research samples`) instead of mixing multiple collectible labels.
- Align pickup, checkpoint, intro, and results wording with the new fiction without changing collectible counts, reward-block payouts, full-clear energy restore behavior, or checkpoint mechanics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `coin-energy-recovery`: player-facing collectible terminology and full-clear messaging use the research-sample fiction while keeping the underlying count and energy-restore rules unchanged.
- `stage-progression`: optional collectible and checkpoint presentation use consistent research-sample and survey-beacon naming without changing collection totals, activation rules, respawn placement, or persistence behavior.
- `gameplay-hud`: active-play HUD labels and status copy use the new collectible and checkpoint fiction consistently.
- `stage-transition-flow`: intro and results screens use the same collectible and checkpoint terms shown during gameplay.
- `audio-feedback`: collectible-pickup and checkpoint-activation feedback remain tied to the same events under the new player-facing fiction.

## Impact

- `src/game/simulation/GameSession.ts`
- `src/game/simulation/state.ts`
- `src/game/content/stages.ts`
- `src/phaser/scenes/BootScene.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/phaser/adapters/sceneBridge.ts`
- `src/ui/hud/hud.ts`
- `src/phaser/scenes/StageIntroScene.ts`
- `src/phaser/scenes/CompleteScene.ts`
- Player-facing collectible, checkpoint, HUD, stage-message, intro-screen, and results-screen copy
- Existing OpenSpec contracts in `openspec/specs/coin-energy-recovery/spec.md`, `openspec/specs/stage-progression/spec.md`, `openspec/specs/gameplay-hud/spec.md`, `openspec/specs/stage-transition-flow/spec.md`, and `openspec/specs/audio-feedback/spec.md`