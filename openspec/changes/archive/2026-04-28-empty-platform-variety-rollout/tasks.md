## 1. Stage Data And Typing Updates

- [x] 1.1 Extend stage catalog/platform metadata to represent empty-platform mechanic families needed by the new variety contract.
- [x] 1.2 Update stage type definitions and parsing contracts so empty-platform segments can declare mechanic-family composition and progression segment tags.
- [x] 1.3 Migrate impacted stage entries to replace jump-only empty-platform runs with mixed mechanic families.

## 2. Authoring Validation Rules

- [x] 2.1 Add validation checks that reject qualifying empty-platform runs authored with only jump-timing beats.
- [x] 2.2 Add validation checks that require at least two supported mechanic families for each qualifying empty-platform traversal challenge run.
- [x] 2.3 Add stage-progression validation checks that enforce empty-platform mechanic-family distribution across early, middle, and late segments.
- [x] 2.4 Add clear validation error messaging that identifies stage, segment, and missing mechanic-family requirements.

## 3. Test Coverage

- [x] 3.1 Update existing stage validation tests to cover jump-only rejection for qualifying empty-platform runs.
- [x] 3.2 Add positive tests for mixed-mechanic empty-platform runs that satisfy platform-variation requirements.
- [x] 3.3 Add progression-level tests that verify mechanic-family distribution across early/mid/late segments.
- [x] 3.4 Update fixtures and snapshots impacted by the new stage typing and validation contracts.

## 4. Implementation Verification

- [x] 4.1 Run unit tests for stage catalog parsing, typing, and validation modules.
- [x] 4.2 Run full test suite and resolve any failing fixtures introduced by the variety rollout.
- [x] 4.3 Perform focused regression checks on stage loading paths that consume updated platform metadata.
