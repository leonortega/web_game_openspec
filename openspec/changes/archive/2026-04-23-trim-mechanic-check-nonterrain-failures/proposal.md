## Why

The broad `Mechanic Checks` helper is reporting two stale non-terrain failures against behavior that already matches the shipped runtime contract: the falling-platform jump probe still assumes an older jump-input timing model, and the gravity-field readability probe still uses an older relative-alpha heuristic. These false failures make the broad report noisy and reduce trust in the helper, so they should be trimmed before the next broad-helper pass adds more coverage.

## What Changes

- Update the broad helper falling-platform jump probe so it follows the current controller truth for escape jumps from a falling platform, including the gravity-inversion composition already covered by runtime tests.
- Update the broad helper gravity-field readability check so it evaluates the live scene using the current gravity-field renderer and debug-snapshot contract instead of a stale relative-alpha comparison.
- Keep this change scoped to stale non-terrain `Mechanic Checks` failures only, leaving terrain-variant false failures for brittle and sticky routes untouched.
- Refresh the broad helper reporting path so `Mechanic Checks` stops flagging these two probes as failures when the runtime and renderer contracts are already satisfied.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `player-controller`: align automated falling-platform escape-jump coverage with the current controller contract instead of a stale helper-side jump-input assumption.
- `stage-progression`: align broad automated gravity-field readability coverage with the current live-scene renderer contract while keeping terrain-variant drift out of scope for this change.

## Impact

- Affected code: `scripts/stage-playtest.mjs`, `src/game/simulation/GameSession.test.ts`, `src/phaser/view/gameSceneStyling.ts`, and `src/phaser/scenes/GameScene.ts`.
- Affected reports: `test_results/unify-launch-platforms-as-springs/playtest-report.md` is the current broad-report source that demonstrates the stale failures.
- Systems affected: broad authored-playtest validation, falling-platform controller verification, and gravity-field live-scene readability checks.