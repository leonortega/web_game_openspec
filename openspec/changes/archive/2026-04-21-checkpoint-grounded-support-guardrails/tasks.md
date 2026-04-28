## 1. Checkpoint Grounding Rules

- [x] 1.1 Update checkpoint authoring and validation so every survey beacon requires visible stable route support and fails when placement depends on floating geometry, hidden helper support, trigger-box hacks, or other non-reusable support tricks.
- [x] 1.2 Add focused authored-data tests for valid grounded checkpoints and for invalid placements that only pass through invisible support, temporary support, or unsupported airborne beacon placement.

## 2. Respawn Grounding Alignment

- [x] 2.1 Update checkpoint restore logic so respawn recovery derives from the grounded checkpoint support contract instead of a raw checkpoint rectangle plus respawn-only Y correction.
- [x] 2.2 Add focused simulation coverage for checkpoint activation and death recovery that confirms grounded respawn behavior remains stable across normal retries and late-stage checkpoint use.

## 3. Authored Audit And Regression Coverage

- [x] 3.1 Audit authored stage checkpoints under the new grounded-support rule and fix only the checkpoints that fail validation.
- [x] 3.2 Add or update scripted playtest coverage that verifies grounded visible checkpoint placement and rejects regressions where checkpoint recovery appears airborne or unsupported.