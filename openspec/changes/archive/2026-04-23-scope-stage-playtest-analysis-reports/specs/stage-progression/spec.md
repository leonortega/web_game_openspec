## ADDED Requirements

### Requirement: Change-scoped stage-playtest analysis honors explicit narrow report scopes
The project SHALL let change-scoped stage-playtest analysis output narrow report rows through explicit `CHANGE_RESULT_SCOPE` entries without rewriting fallback behavior for unmapped changes. When a change name has an explicit scope entry, `scripts/stage-playtest-analysis.mjs` MUST filter report rows to exactly that scoped subset before emitting change-scoped output. Narrow cleanup changes whose archived intent is limited to broad-helper `Mechanic Checks`, including `trim-mechanic-check-nonterrain-failures` and `trim-mechanic-check-terrain-failures`, MUST scope their change-scoped analysis output to `Mechanic Checks` only so unrelated rows do not appear in those reports. Changes without explicit entries MAY continue using the existing fallback behavior, and this requirement MUST NOT introduce pattern-based inference for future change names.

#### Scenario: Scoping recent narrow mechanic-check cleanup changes
- **WHEN** change-scoped analysis runs for `trim-mechanic-check-nonterrain-failures` or `trim-mechanic-check-terrain-failures`
- **THEN** the emitted report rows include only `Mechanic Checks`
- **AND** unrelated report sections do not appear in that change-scoped output

#### Scenario: Preserving fallback behavior for unmapped changes
- **WHEN** change-scoped analysis runs for a change name without an explicit `CHANGE_RESULT_SCOPE` entry
- **THEN** the existing fallback behavior remains in effect
- **AND** analysis does not infer a new scope from change-name patterns alone