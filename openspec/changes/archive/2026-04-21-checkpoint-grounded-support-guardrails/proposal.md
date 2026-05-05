## Why

Checkpoint support rules currently say survey beacons should stand on safe, stable footing, but the repo does not yet enforce a direct grounded-support contract strongly enough to prevent authored floating beacons or respawn anchors that inherit from unsupported checkpoint rectangles. This change closes that gap now so checkpoint placement, validation, and respawn behavior all agree on visible grounded support instead of relying on content luck or one-off runtime nudges.

## What Changes

- Tighten checkpoint authoring requirements so every survey beacon is visibly grounded on intended route support rather than appearing suspended in air or resting on hidden helper geometry.
- Add explicit guardrails that require stable reusable support under the checkpoint itself and reject false-positive fixes such as invisible helper support, oversized trigger-box tricks, respawn-only vertical offsets, or isolated one-off content nudges without reusable validation.
- Strengthen checkpoint validation and focused regression coverage so unsupported or weakly supported checkpoint placements fail before runtime use.
- Clarify respawn expectations so checkpoint restoration starts from grounded authored support, not from an unchecked checkpoint rectangle that can place the player into an airborne or unsupported recovery state.
- Audit authored checkpoint placements under the new rule and fix any stage data that fails the grounded-support contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `stage-progression`: checkpoint requirements should enforce visible grounded placement, stable reusable support, anti-hack authoring guardrails, and authored validation or audit coverage for unsupported survey beacons.
- `player-progression`: checkpoint progression requirements should align respawn semantics with grounded checkpoint support so active checkpoint restoration does not rely on unsupported checkpoint rectangles or respawn-only vertical correction.

## Impact

- OpenSpec contracts for checkpoint authoring, validation, respawn grounding, and stage-content audit expectations.
- Likely implementation touchpoints in `src/game/content/stages.ts`, `src/game/content/stages.test.ts`, `src/game/simulation/GameSession.ts`, `src/game/simulation/GameSession.test.ts`, and any checkpoint-focused authored validation or stage-playtest scripts.
- Regression coverage in authored stage validation, focused checkpoint simulation tests, and scripted playtests that confirm grounded checkpoint placement and recovery behavior.