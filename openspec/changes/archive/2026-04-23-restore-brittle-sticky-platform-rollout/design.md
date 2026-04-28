## Context

Current engine, renderer, validation, and spec support for `brittleCrystal` and `stickySludge` platform variants already exists, but the current shipped main-stage catalog and related tests were recently realigned around zero live campaign terrain variants. This restore change is therefore a cross-cutting authoring and contract realignment task: product code does not need new terrain behavior, but stage catalog data, rollout validation, and spec coverage need a new source-of-truth requirement for where those existing variants must appear.

Historic pre-removal coordinates are not recoverable with confidence. Apply should therefore restore live rollout by authoring new or revised placements that fit the current shipped routes in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, while preserving the current bounded contract for full static-platform variants, brittle warning or break or reset semantics, sticky grounded-drag-only semantics, and readable visual presentation.

## Goals / Non-Goals

**Goals:**
- Restore live authored brittle or sticky platform use to all three current main stages.
- Make the restored rollout explicit in OpenSpec so authored-stage validation and automated tests no longer enforce campaign absence.
- Keep restore scope bounded to full static-platform `terrainVariant` authoring and current visual or simulation semantics.
- Let apply choose placements that fit current routes without pretending exact historical coordinates are known.

**Non-Goals:**
- Reintroduce legacy terrain overlays, terrain-surface collections, or any non-platform-owned brittle or sticky data shape.
- Change brittle countdown, break timing, fair-support-at-expiry, reset behavior, or sticky movement semantics.
- Require manual gameplay validation or a broad scripted playtest pass as part of this proposal-stage contract.
- Force exact restoration of removed coordinates, beat counts, or route geometry from older campaign revisions.

## Decisions

- Restore rollout by authored campaign placements, not by reviving old coordinates.
  - Rationale: removal happened after earlier stage iterations, and exact former placements are not trustworthy source-of-truth anymore. Apply should author fresh placements against the current shipped routes.
  - Alternative considered: require exact coordinate restoration from archived stage versions. Rejected because proposal would encode false precision and could regress newer route safety work.
- Require each current main stage to contain at least one visibly authored brittle or sticky terrain-variant beat, while campaign-wide rollout must include both variant kinds.
  - Rationale: this restores live use across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array without reviving earlier hard quotas that may no longer fit the shipped layouts.
  - Alternative considered: restore old per-stage minimum counts for both variants. Rejected because those counts are not recoverable from the handoff and are not necessary to reestablish live rollout.
- Keep verification centered on authored-data validation and automated coverage for campaign presence, with optional script updates only if current analysis still encodes zero-variant assumptions.
  - Rationale: user preference skips scripted playtests and manual gameplay validation by default, and current task is about restoring authored rollout and contract coverage rather than proving hand-play outcomes.
  - Alternative considered: require updated scripted playtests as mandatory acceptance. Rejected because it broadens apply scope beyond the normalized request.
- Preserve existing terrain semantics exactly as shipped in current specs.
  - Rationale: engine support already exists, and user intent is restore live authored use, not redesign brittle or sticky behavior.
  - Alternative considered: retune sticky jump behavior or brittle timing while restoring rollout. Rejected because it would couple unrelated mechanic changes to a catalog rollback.

## Risks / Trade-offs

- [Risk] Restored placements may overload a main-route beat or collide with newer safety tuning. -> Mitigation: require apply to fit placements to current route geometry and keep each restored beat readable rather than forcing archival coordinates.
- [Risk] Verification may still drift if one spec or test path continues to assume zero main-stage terrain variants. -> Mitigation: explicitly update both `platform-variation` and `stage-progression`, and task authored validation plus automated stage tests together.
- [Risk] Minimal rollout requirement could restore too little authored variety. -> Mitigation: require all three main stages to participate and require campaign-wide presence of both brittle and sticky variants.
- [Risk] Optional script changes could leave stale reporting text. -> Mitigation: include script or analysis updates only when those helpers still encode post-removal absence assumptions.