## Why

Change-scoped output from `scripts/stage-playtest-analysis.mjs` already narrows report rows correctly when `CHANGE_RESULT_SCOPE` contains explicit entry for change name. Two recent narrow cleanup changes do not have entries in that map, so scoped analysis falls back to full report output and buries intended `Mechanic Checks` slice under unrelated rows. That makes report noise look broader than change scope and weakens usefulness of scoped analysis for these cleanup changes.

## What Changes

- Add explicit `CHANGE_RESULT_SCOPE` entries for `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`.
- Scope both narrow cleanup changes to `Mechanic Checks` only so change-scoped analysis output matches archived proposal intent.
- Keep implementation bounded to explicit map maintenance in `scripts/stage-playtest-analysis.mjs` without changing fallback behavior, helper logic, or broad scope inference for future changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stage-progression`: keep scoped stage-playtest analysis output aligned with narrow `Mechanic Checks` cleanup changes when explicit change-name scope entries exist.

## Impact

- `scripts/stage-playtest-analysis.mjs`
- `openspec/specs/stage-progression/spec.md`
- Change-scoped reports for `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`