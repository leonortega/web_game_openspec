## Why

The current code persists run progress and menu settings across app reloads, but the OpenSpec set does not describe that storage and boot-hydration behavior. The specs also no longer match the shipped menu options surface, which exposes difficulty, enemy pressure, music volume, SFX volume, and a CRT toggle instead of the older master-volume-only contract.

## What Changes

- Add a new capability that defines persisted run progress and run-settings hydration across boot and reload flow.
- Update the main menu capability so the `Options` surface reflects the current shipped controls: difficulty, enemy pressure, music volume, SFX volume, and CRT on or off.
- Document that persisted progress covers unlocked stage progression, total collected samples, active powers, invincibility timer state, and current run settings, while stage-local checkpoint and route state still reset through normal runtime rules.

## Capabilities

### New Capabilities
- `run-progress-persistence`: Persist and restore run-level progression and run settings across reloads without restoring stage-local attempt state.

### Modified Capabilities
- `main-menu`: Update the options contract to match the current settings surface and remove the outdated master-volume-only requirement.

## Impact

- Affected code: `src/phaser/persistence/RunProgressStore.ts`, `src/phaser/adapters/sceneBridge.ts`, `src/phaser/scenes/BootScene.ts`, `src/phaser/scenes/MenuScene.ts`, `src/game/simulation/GameSession.ts`, `src/game/simulation/state.ts`
- Systems: boot flow, local persisted storage, run settings, menu options, progression hydration
- Dependencies: existing Rex localforage files plugin and CRT post-fx plugin wiring
