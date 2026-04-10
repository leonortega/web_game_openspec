## Context

Stage content currently needs stronger authored-layout validation for static world pieces, and turret shooters are too camera-strict for readable telegraphing near the edge of the screen. This change covers both authored geometry safety and a camera-relative shooter warning window.

## Goals / Non-Goals

**Goals:**
- Prevent authored static elements from overlapping or interpenetrating in the same world space.
- Allow edge-adjacent static placements when the author intends elements to touch without overlap.
- Expose turret bullets and firing audio slightly before a turret fully enters the viewport using a measurable lead margin.
- Verify both behaviors with regression fixtures and at least one live playtest probe.

**Non-Goals:**
- Redesign turret AI, projectile behavior, or enemy difficulty.
- Add new menu flow or HUD behavior.
- Change stage traversal rules beyond the affected placement and telegraph constraints.

## Decisions

- Use authored-content validation rather than runtime correction for static-element overlap.
  - Rationale: overlap is a content issue, and rejecting it early keeps layouts readable and deterministic.
  - Alternative considered: resolve overlaps at runtime by nudging or clamping placements. Rejected because it hides bad authored data and makes the final layout harder to reason about.
- Define the turret telegraph window as a camera-relative lead margin in world/tile units.
  - Rationale: the rule becomes measurable and testable, and it stays stable across resolutions and camera sizes.
  - Alternative considered: frame-delay based telegraphing. Rejected because it is not viewport-relative and would vary with performance and timing state.
- Apply the same lead margin to both bullet emission and firing audio.
  - Rationale: the player should hear the same warning window they can see, without mismatched audio/visual cues.
  - Alternative considered: audio-only early warning. Rejected because it would make the shooter feel inconsistent and harder to test.
- Keep the behavior centralized in stage-content and shooter gating logic.
  - Rationale: static placement checks belong with authored content validation, while telegraph timing belongs with the shooter emission gate.
  - Alternative considered: stage-by-stage special cases. Rejected because it would fragment the rule and make verification weaker.

## Risks / Trade-offs

- [Risk] Tighter layout validation may invalidate existing authored stages. → Mitigation: update affected layouts during implementation and verify the new rule against stage fixtures.
- [Risk] A generous lead margin could make turrets feel too early at screen edges. → Mitigation: keep the margin small and measured in fixed world units.
- [Risk] Static-element overlap checks may reject intentional decorative touching if the categories are too broad. → Mitigation: validate against actual collision bounds and allow edge contact when bounds do not overlap.
