## Context

The repo already supports authored long-form stages, fixed player powers, stage intro and clear screens, a main menu with help text, and a top-of-screen HUD. The requested change is broad across content and presentation, but it stays implementable because the underlying runtime can be reused: stage data can be expanded, scene copy can be rethemed, and player-facing names or palettes can be layered on top of the existing mechanics rather than replacing them.

## Goals / Non-Goals

**Goals:**
- Retheme the player and stage presentation around an astronaut exploring alien biomes.
- Introduce stable display metadata for stage names, palette direction, and player-facing power names without changing the underlying power enums or mechanics.
- Expand the authored stages with more segments, optional detours, elevated routes, and encounter tuning using the current stage content model.
- Keep the change compatible with the existing scene flow, HUD layout, stage validation, and playtest tooling.

**Non-Goals:**
- Add new gravity rules, oxygen systems, jetpack flight, procedural generation, or new enemy archetypes.
- Rewrite the Phaser scene stack, simulation loop, or save or run-state model.
- Introduce a new hub structure or non-linear world map.

## Decisions

- Keep gameplay mechanics keyed by the existing four supported powers and add a presentation mapping for player-facing names.
  - Rationale: the repo already has working logic for double jump, shooter, invincibility, and dash. A display-name layer lets HUD, menus, intros, and reward reveals show `Thruster Burst`, `Plasma Blaster`, `Shield Field`, and `Booster Dash` without forcing runtime enum or balance changes.
  - Alternative considered: rename the underlying power identifiers everywhere. Rejected because it would create unnecessary churn across simulation, tests, and authored content for a purely presentation-driven change.
- Represent the astronaut reskin through stage metadata and scene presentation, not through a new rendering architecture.
  - Rationale: the likely touchpoints already include stage content, HUD, and scene bridge surfaces. Extending existing stage descriptors with authored display names, biome palette tags, and related text keeps the work local to current systems.
  - Alternative considered: introduce a separate theme manager or scene-specific skin framework. Rejected because the repo scope does not justify another abstraction layer.
- Expand playable space through authored segments and reconnecting optional routes inside the current stage model.
  - Rationale: the game already supports long-form routes, checkpoints, collectibles, and platform variation. More content can be delivered by extending stage layouts with alternate high-air lines, hidden reward pockets, and additional segment transitions rather than by adding a new world structure.
  - Alternative considered: add a hub or procedural branch generator. Rejected because it exceeds the requested scope and would pull the change toward a runtime rewrite.
- Tune encounter density in authored layouts and existing pressure settings instead of changing enemy AI.
  - Rationale: the request is about readability and spacing, not new combat behaviors. Adjusting placements, safe staging points, and route pressure is enough to produce more deliberate encounters.
  - Alternative considered: add new enemy behavior states or spawn systems. Rejected because it solves a different problem than the one described in the handoff.
- Reuse the existing validation and playtest surfaces to verify longer routes and safer encounter composition.
  - Rationale: the repo already has staged playtest scripts and authored-content validation paths. Extending those checks is lower risk than building a separate verification workflow.
  - Alternative considered: rely on manual scene inspection only. Rejected because the change spans multiple stages and presentation surfaces.

## Risks / Trade-offs

- [Risk] Presentation data can drift if stage names, power labels, and help text are updated in some scenes but not others. → Mitigation: define a single authored metadata source for display names and consume it in HUD, menu, and transition screens.
- [Risk] Stage expansion can create long empty stretches if extra space is added without new authored beats. → Mitigation: require new segments to include terrain changes, optional rewards, encounter pacing, or checkpoint value.
- [Risk] Higher optional-route density can spill onto the critical path and feel unfair. → Mitigation: keep stronger pressure inside clearly optional detours and preserve readable footholds on the main route.
- [Risk] Asset or palette work could balloon into a broader art pipeline change. → Mitigation: constrain the implementation to the current rendering assets, color treatments, and scene copy surfaces already used by the game.