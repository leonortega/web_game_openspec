## Why

The stage intro still renders a right-side signal-bars accent even though the requested direction is to remove that treatment rather than restyle it. Tightening the contract now avoids preserving a decorative element that the user no longer wants and keeps the intro surface focused on readable stage and player status.

## What Changes

- Remove the stage intro's right-side signal-bars accent instead of replacing it with another animated intro motif.
- Narrow the transition contract so stage intro accent motion is optional rather than expected, while preserving the existing readability, timing, and audio-handoff rules.
- Update stage intro validation and playtest expectations that currently require `accentMode='signal-bars'` so they accept the no-accent presentation.
- Keep scope limited to stage intro presentation and related validation; do not broaden into stage-clear or completion-scene presentation changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-transition-flow`: the pre-stage transition surface no longer requires a bounded accent loop and must allow a fully text-and-stage-focused presentation with no intro accent.

## Impact

- OpenSpec contract updates for stage intro transition presentation in `openspec/specs/stage-transition-flow/spec.md`.
- Likely implementation touchpoints in `src/phaser/scenes/StageIntroScene.ts` and `scripts/capsule-exit-teleport-finish-playtest.mjs`.
- Regression coverage in the stage intro playtest flow and any validation that currently asserts `accentMode='signal-bars'`.