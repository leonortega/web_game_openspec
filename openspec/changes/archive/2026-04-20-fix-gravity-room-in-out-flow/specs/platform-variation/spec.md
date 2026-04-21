## MODIFIED Requirements

### Requirement: Current playable stages enclose every authored gravity modification section
The game SHALL use enclosed gravity room sections for every authored anti-grav stream and every authored gravity inversion column in the current playable stages. Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array MUST NOT leave any authored gravity-modification section as an open unframed field on the intended route or an authored optional branch. Each authored gravity field in those stages MUST belong to exactly one enclosed gravity room section, and each room MUST keep a biome-authored layout rather than repeating one uniform shell arrangement across all stages. Across that rollout, each room MUST also keep a gravity-focused interior layout whose primary authored beats are room entry, in-room gravity traversal, disable-button access, and room exit, rather than a legacy bundle of unrelated room-local mechanics. For the current gravity rooms in that rollout, `IN` MUST mean left-side room entry and `OUT` MUST mean right-side room exit from the player-facing read of the room, not merely from a technically reachable opening pair. Left-side entry and right-side exit compliance MUST be satisfied by repositioning door openings onto existing intended route-support platforms or moving supports that are already part of the room's authored traversal path, and those rooms MUST NOT add dedicated extra support platforms whose sole purpose is making the side-aware door rule pass. A current yellow-marked door or platform arrangement that is wrong for doorway flow MUST either be removed entirely or remain only as non-doorway geometry that no longer serves as the entry or exit solution. The rollout MUST NOT use helper ledges, doorway-only compliance platforms, or fake low bottom-door workarounds to satisfy the current four-room gravity-room contract. `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` MUST each preserve the enclosed-room shell, linked gravity field, interior disable button, and retry/reset behavior while being re-authored under that same IN-left and OUT-right rule.

#### Scenario: Loading Verdant Impact Crater
- **WHEN** Verdant Impact Crater is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Ember Rift Warrens
- **WHEN** Ember Rift Warrens is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Loading Halo Spire Array
- **WHEN** Halo Spire Array is loaded for runtime use
- **THEN** every authored anti-grav or inversion section in that stage belongs to an enclosed gravity room

#### Scenario: Comparing room rollout across stages
- **WHEN** the player compares current playable stages with enclosed gravity sections
- **THEN** each stage uses the full enclosed-room rollout with its own authored room geometry and route shape rather than leaving legacy open-field exceptions behind
- **AND** each room still reads as a gravity-focused traversal segment rather than a mixed-mechanic bundle

#### Scenario: Authoring forest room IN and OUT flow
- **WHEN** `forest-anti-grav-canopy-room` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side room entry and its `OUT` doorway uses a right-side room exit
- **AND** any yellow-marked current arrangement that is wrong for doorway flow is removed or demoted so it no longer serves as the doorway solution

#### Scenario: Authoring amber room IN and OUT flow
- **WHEN** `amber-inversion-smelter-room` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side room entry and its `OUT` doorway uses a right-side room exit
- **AND** any yellow-marked current arrangement that is wrong for doorway flow is removed or demoted so it no longer serves as the doorway solution

#### Scenario: Authoring sky anti-grav room IN and OUT flow
- **WHEN** `sky-anti-grav-capsule` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side room entry and its `OUT` doorway uses a right-side room exit
- **AND** the room does not rely on a helper ledge, doorway-only compliance platform, or fake low bottom-door workaround to achieve that flow

#### Scenario: Authoring sky inversion room IN and OUT flow
- **WHEN** `sky-gravity-inversion-capsule` is authored for the current rollout
- **THEN** its `IN` doorway uses a left-side room entry and its `OUT` doorway uses a right-side room exit
- **AND** any geometry that remains from a prior wrong doorway arrangement no longer counts as the entry or exit solution

#### Scenario: Repositioning a current gravity-room door without helper platforms
- **WHEN** a current playable enclosed gravity room must satisfy the side-aware entry-left and exit-right door contract
- **THEN** its door openings reuse existing intended route-support geometry on the relevant side
- **AND** the authored solution does not add a dedicated extra support platform whose sole purpose is satisfying doorway-side compliance