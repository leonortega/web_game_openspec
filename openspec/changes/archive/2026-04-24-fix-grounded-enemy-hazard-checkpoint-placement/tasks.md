## 1. Catalog Audit And Data Repair

- [x] 1.1 Audit authored stage catalog entries for non-flying enemies, floor hazards, and checkpoints that sit above or detach from visible intended support.
- [x] 1.2 Correct affected catalog placements so grounded actors and checkpoints resolve on their intended route support without adding helper floors or render-only offsets.

## 2. Shared Grounded-Support Guardrails

- [x] 2.1 Add reusable grounded-support helpers in stage builders and validation for non-flying enemies, floor hazards, and checkpoints.
- [x] 2.2 Reject unsupported placements that only pass through blanket Y fudges, loosened tolerances, hidden support, or hover-like fallback for non-flyers.

## 3. Runtime And Scene Alignment

- [x] 3.1 Update simulation/bootstrap placement flow so grounded enemy and hazard spawn positions use the resolved authored support contract.
- [x] 3.2 Align checkpoint visuals and respawn anchoring to the same resolved support position used by the visible beacon base.
- [x] 3.3 Preserve existing flyer behavior unchanged while ensuring grounded rendering does not mask unsupported content.

## 4. Focused Verification

- [x] 4.1 Add or update focused validation tests for grounded enemy, floor hazard, and checkpoint placement regressions.
- [x] 4.2 Add or update focused runtime or scene tests that confirm supported spawn positions stay consistent with rendered placement and checkpoint recovery anchors.
- [x] 4.3 Run targeted project checks for the touched stage-content, validation, simulation, and scene slices.