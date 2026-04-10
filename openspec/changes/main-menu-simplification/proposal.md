## Why

The current main menu is doing too much at once: the screen shows subtitle copy, run-state footer/meta text, and other persistent chrome alongside the title and controls. That makes the entry screen noisier than it needs to be, and it distracts from the only things the player needs before starting a run: the game name and the available options.

## What Changes

- Simplify the default main menu presentation so it shows only the game name and the interactive option list by default.
- Remove persistent subtitle, footer, and run/meta clutter from the default menu view.
- Keep the existing menu actions and settings available through the option list.
- Update menu verification so tests assert the simplified layout instead of the removed footer/meta content.

## Capabilities

### Modified Capabilities
- `main-menu`: The default menu layout changes to a minimal title-and-options screen, while existing option behavior remains available.

## Impact

- Affected scene code in `src/phaser/scenes/MenuScene.ts`.
- Menu flow and layout assertions in `scripts/stage-playtest.mjs`.
- The existing `openspec/specs/main-menu/spec.md` capability contract.
- No gameplay rules, save data, or stage content changes are expected.
