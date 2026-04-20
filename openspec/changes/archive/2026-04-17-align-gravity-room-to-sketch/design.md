## Context

Current enclosed gravity rooms already exist in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array, but the shipped implementation does not fully match the intended sketch contract. Presentation code in `src/phaser/scenes/GameScene.ts` force-recolors room-local platforms and enemies, while authored room contents in `src/game/content/stages.ts` still combine gravity sections with extra mechanics, pickups, and pressure elements that dilute the room's core read. The existing stage schema already contains the shell rectangle, separate entry and exit door rectangles, a linked interior button, route bounds, and room-local content lists, so the change should tighten behavior around that model rather than inventing a parallel gravity-room system.

## Goals / Non-Goals

**Goals:**
- Make enclosed gravity room shells behave like actual traversal boundaries outside the authored door openings.
- Preserve normal authored visual treatment for room-local platforms, enemies, terrain, and pickups inside gravity rooms.
- Re-author current gravity rooms so the player's read centers on gravity behavior, one disable button, and the intended in-room route.
- Keep the change global across the current gravity-room rollout without changing core gravity-controller semantics.

**Non-Goals:**
- Redesign gravity fields into a new mechanic family or add room-state systems beyond the existing enabled/disabled toggle.
- Introduce new interact inputs, multi-button logic, timed toggles, or room-specific HUD flows.
- Remove all challenge from gravity rooms; stage-local support or a small amount of pressure remains allowed when it is necessary for reachability and route readability.
- Rework unrelated stage sections or non-gravity traversal presentation.

## Decisions

### 1. Use existing shell and door data as authoritative room-wall geometry
The implementation should derive blocking room-wall behavior from each gravity capsule's existing `shell`, `entryDoor`, and `exitDoor` rectangles instead of adding new wall rectangles to the stage schema. This keeps authoring aligned with the current data model, prevents duplicate geometry sources, and makes validation straightforward: the shell is solid except where the two bottom doors carve openings.

Alternative considered: add explicit wall segments to each room definition. Rejected because it duplicates data that is already implied by the shell and openings and would make existing rooms harder to maintain.

### 2. Simplify room scope through authored layout and validation, not runtime feature flags
Current rooms drift because their content lists include optional collectibles, launchers, extra hazards, and enemy pressure that are not required for the gravity-button route. The implementation should simplify this at the authored-stage level and extend validation to reject rooms whose local content no longer reads as a gravity-focused contained segment.

Alternative considered: keep existing authored rooms and add runtime suppression rules for some content inside active rooms. Rejected because it would create hidden room-specific behavior and make authoring harder to reason about.

### 3. Communicate room state through shell, door, button, and field cues only
Interior room content should keep its normal stage-authored visual language. Readability for active versus disabled rooms should come from the room shell, door openings, button state, and field presentation rather than from force-recoloring platforms or enemies black and red.

Alternative considered: preserve the current recolor pass as a shorthand grouping cue. Rejected because it contradicts the sketch intent, overrides biome-authored presentation, and couples room readability to unrelated content colors.

### 4. Keep current controller composition unchanged
The change should not alter how anti-grav streams or inversion columns compose with jump, launcher, dash, or reset semantics. Implementation work should stay in stage authoring, authored-data validation, collision enforcement for room walls, and presentation cleanup.

Alternative considered: adjust gravity-field behavior to compensate for tighter rooms. Rejected because controller semantics are already covered by existing specs and are not the problem being fixed.

## Risks / Trade-offs

- Tightening shell collision could expose legacy room layouts that only worked because walls were presentation-only. → Re-author all current gravity rooms and extend validation/playtest coverage around entry, button reach, and exit routing.
- Simplifying room-local content may reduce encounter variety in those spaces. → Keep minimal support geometry or light pressure only where needed for readable traversal and button access.
- Removing interior recolor cues could make some rooms feel less grouped at first glance. → Preserve a strong shell, door, button, and field-state grammar so room identity stays local and obvious.
- Re-authoring all current gravity rooms increases apply scope across multiple stages. → Keep the change bounded to existing gravity-room sections and avoid unrelated stage cleanups during implementation.

## Migration Plan

1. Remove runtime interior recolor logic and keep room-state cues on shell/button/field presentation.
2. Enforce shell wall blocking from existing room shell and door rectangles.
3. Re-author each current gravity room to remove non-essential mixed mechanics and confirm button-to-exit reachability.
4. Update authored-data tests and scripted coverage for wall blocking, room reset behavior, and preserved interior presentation.

## Open Questions

None. The requested scope is concrete enough to proceed to implementation.