## Context

The live terrain-surface implementation already supports `brittleCrystal` and `stickySludge`, and the current renderer draws those surfaces with Phaser rectangle game objects in `src/phaser/scenes/GameScene.ts`. The problem is not missing mechanics; it is that the existing surfaces read too similarly at gameplay speed and appear too infrequently in authored stage data to shape route identity. The requested change therefore needs to strengthen presentation and authored density without widening into a new texture pipeline, tilemap path, or generalized environmental-material system.

## Goals / Non-Goals

**Goals:**
- Make brittle crystal and sticky sludge visually distinguishable at a glance using bounded cues that fit the current rectangle-based renderer.
- Broaden authored placement for those two existing terrain kinds across the three main stages with concrete, verifiable minimums.
- Keep terrain rollout stage-authored and route-specific rather than globally patterned.
- Add validation and scripted coverage that protects both the authored rollout counts and the intended readability contract.

**Non-Goals:**
- Add new terrain kinds beyond `brittleCrystal` and `stickySludge`.
- Rewrite terrain rendering around textures, tilemaps, spritesheets, or a shader-first pipeline.
- Expand scope into gravity fields, magnetic platforms, reveal platforms, or other environmental mechanics.
- Redesign the simulation semantics of brittle breakage or sticky movement beyond what is needed to support presentation and broader authored use.

## Decisions

- Keep the renderer on the current rectangle-based Phaser path and layer lightweight overlays on top of the existing terrain rectangles.
  - Rationale: the explore handoff explicitly identifies `GameScene.ts` as the live terrain path and recommends overlay geometry, pattern, and motion cues instead of a texture rewrite. This keeps apply work localized and avoids introducing a second rendering model for authored surfaces.
  - Alternative considered: migrate special terrain rendering to textures or tilemap art. Rejected because it broadens the change beyond presentation readability.
- Define a distinct presentation contract for each existing surface kind.
  - `brittleCrystal` should read as crystalline and fragile while intact, intensify its warning state before collapse, and read as clearly broken afterward.
  - `stickySludge` should read as viscous and drag-inducing while active, using layered banding, pooled overlays, or subtle in-rectangle motion so it is legible beyond palette difference alone.
  - Rationale: the request is about visual distinction, so apply needs explicit player-facing cues rather than a vague “make it clearer” instruction.
  - Alternative considered: only retune colors and alpha. Rejected because that is the current weak path.
- Broaden rollout through authored placement minimums in stage data and tests rather than through runtime procedural duplication.
  - Resulting rule: each current main stage should carry at least two brittle crystal surfaces and at least two sticky sludge surfaces across at least two distinct traversal beats on the intended route or an optional reconnecting branch.
  - Rationale: this is concrete enough for `stages.ts`, `stages.test.ts`, and playtest coverage to enforce, while still leaving exact placement to stage authoring.
  - Alternative considered: require only “more” surfaces without a minimum. Rejected because it is not verify-friendly.
- Keep validation split between authored-data integrity and readability-oriented coverage.
  - Resulting approach: stage-data tests should assert the per-kind rollout minimums and intended-route placement constraints, while scripted playtest or targeted regression coverage should confirm that brittle and sticky sections expose their distinct readable cues during traversal.
  - Rationale: static validation can prove counts and placement, but the readability contract still benefits from an execution-path check.
  - Alternative considered: attempt to statically validate visual readability from data alone. Rejected because the presentation contract lives in runtime rendering.

## Risks / Trade-offs

- [Risk] Additional overlays could reduce readability if they become visually noisy. → Mitigation: keep cues bounded to the authored rectangle and differentiate kinds with a small number of stable motifs rather than dense effects.
- [Risk] Hard rollout minimums may force awkward clustering if stage authoring is not deliberate. → Mitigation: require the surfaces to span at least two traversal beats and preserve biome-specific placement.
- [Risk] Readability coverage may become too subjective if it relies only on manual playtest. → Mitigation: pair scripted route probes with explicit spec language for what each surface must communicate.
- [Risk] Apply might accidentally broaden scope into new terrain systems while touching stage data and rendering. → Mitigation: keep the artifacts explicit that only existing `brittleCrystal` and `stickySludge` kinds are in scope.

## Migration Plan

1. Update the terrain-surface presentation in the existing rectangle renderer so brittle crystal and sticky sludge have distinct bounded overlays and state cues.
2. Re-author the three main stages to meet the new per-kind rollout minimums without turning the placement into a uniform pattern.
3. Extend authored-data tests to assert the broadened terrain counts and intended-route placement expectations.
4. Extend scripted or targeted regression coverage to confirm the new readability cues are present and that broadened rollout remains traversable.

## Open Questions

None for apply readiness. The explore handoff resolves the intended scope, rendering path, and terrain kinds.