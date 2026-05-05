## MODIFIED Requirements

### Requirement: Current main stages restore live brittle and sticky platform rollout
The game SHALL use authored full-platform `brittleCrystal` and `stickySludge` static-platform surface mechanics as live traversal beats in the shipped main campaign instead of confining those mechanics to non-campaign fixtures only. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST each contain at least one visibly authored brittle or sticky platform-surface beat on current shipped route geometry or a readable nearby branch. Across those three stages, the restored rollout MUST include at least one live `brittleCrystal` beat and at least one live `stickySludge` beat. Restored beats MUST keep the current static-platform surface-mechanic contract, MUST preserve current brittle warning or delayed-break or reset semantics and current sticky grounded-drag-only semantics, and MUST read visually as authored terrain variants rather than as unchanged plain green support. Because pre-removal coordinates are not authoritative, restored beats MAY use newly authored placements that fit the current shipped catalog so long as they remain readable and traversable.

#### Scenario: Entering a restored main-stage terrain beat
- **WHEN** the player reaches Verdant Impact Crater, Ember Rift Warrens, or Halo Spire Array in the shipped campaign
- **THEN** that stage includes at least one visibly authored brittle or sticky full-platform terrain beat
- **AND** that beat uses the current static-platform `surfaceMechanic.kind` contract instead of a legacy overlay or hidden normal-platform presentation

#### Scenario: Comparing restored campaign terrain rollout
- **WHEN** the player compares the three current main stages
- **THEN** each stage includes at least one visibly authored brittle or sticky full-platform terrain beat on current route geometry or a readable nearby branch
- **AND** the combined rollout still includes both `brittleCrystal` and `stickySludge`