## 1. Change Scope Entries

- [x] 1.1 Add `CHANGE_RESULT_SCOPE` entries for `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures` in `scripts/stage-playtest-analysis.mjs`
- [x] 1.2 Scope both entries to `Mechanic Checks` only and leave existing fallback behavior unchanged for unmapped changes

## 2. Focused Validation

- [x] 2.1 Run change-scoped analysis for `trim-mechanic-check-nonterrain-failures` and confirm output contains only `Mechanic Checks` rows
- [x] 2.2 Run change-scoped analysis for `trim-mechanic-check-terrain-failures` and confirm output contains only `Mechanic Checks` rows
- [x] 2.3 Confirm an unmapped change name still uses existing fallback behavior without new pattern inference