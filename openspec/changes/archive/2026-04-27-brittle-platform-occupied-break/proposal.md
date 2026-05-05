## Why

User intent says breakable platform still feels same and does not clearly communicate brittle progression tied to player occupancy. Current behavior lacks a strict player-readable contract for what changes while player stays, walks, or hop-jumps on brittle support, and exactly when break/fall should happen after warning progression completes.

## What Changes

- Define brittle platform as occupied-warning mechanic: warning progression advances only while player has valid top-surface support occupancy.
- Define occupied traversal continuity: staying, walking, and short hop-jump recontacts are treated as one occupancy window for warning progression.
- Define break trigger: once warning progression completes, brittle platform remains support only until player leaves top-surface support; break/fall happens on that leave transition.
- Require a visible three-state read for brittle platforms in play: intact, warning-in-progress, and ready-to-break while still occupied.
- Keep falling-platform contact-aware semantics from prior change unchanged unless a future explicit change modifies them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-variation`: brittle crystal platforms gain explicit occupied warning progression and leave-triggered break contract.

## Impact

- `src/game/simulation/state.ts`
- `src/game/simulation/GameSession.ts`
- `src/game/simulation/state.test.ts`
- `src/game/simulation/GameSession.test.ts`
- `src/phaser/scenes/GameScene.ts`
- `src/game/content/stages.ts`
- Stage fixtures that currently use `brittleCrystal` platform variants