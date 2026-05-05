## Context

This change spans UI presentation, stage authoring rules, player rendering, and enemy firing behavior. The requested outcome is a cleaner HUD, safer authored reward-block placement, stronger visual feedback for active powers, and shooter enemies that do not reveal or emit bullets until they are actually on screen.

The current implementation surface is likely split across the gameplay HUD renderer, stage content validation, player appearance handling, and the shooter enemy simulation/audio path. That makes the change cross-cutting enough to justify an explicit design before implementation.

## Goals / Non-Goals

**Goals:**
- Keep the core HUD readable in one horizontal top row.
- Preserve run and segment context in a small, low-distraction bottom-right label.
- Prevent authored reward blocks from creating same-lane progression locks above stompable enemies.
- Make each supported power visibly distinct on the player, not just in text.
- Gate shooter bullets and their sound cues on camera visibility.

**Non-Goals:**
- Reworking the entire HUD style system or introducing new gameplay metrics.
- Changing the base move set, damage model, or enemy taxonomy.
- Adding new powers beyond the existing supported set.
- Changing stage progression logic beyond reward-block placement safety.

## Decisions

### 1. Treat the HUD as one primary status bar plus one secondary corner label
The primary HUD should keep only `Stage`, `Coins`, `Health`, and `Power` in a single horizontal band. `Run` and `Segment` should move to compact bottom-right text so they remain available without competing with core combat status.

Alternative considered: remove `Run` and `Segment` entirely during play. Rejected because they still provide useful pacing/context and the request explicitly preserves them, just out of the main HUD.

### 2. Validate reward-block placement as authored-content safety
The overlap rule belongs in stage authoring validation, not runtime collision handling. The rule should reject or flag reward blocks that sit in the same lane above stompable grounded enemies when that creates an upward interaction lock.

Alternative considered: detect and solve the conflict at runtime. Rejected because broken authored content would still ship and runtime fixes are harder to reason about in levels that depend on deterministic block placement.

### 3. Drive power visuals from a power-to-presentation mapping
Each supported power should map to a specific player presentation variant, with the variant applied when the power is granted and cleared when the power ends. The implementation can use distinct colors, alternate assets, or both, but the decision point should be the active power state rather than the HUD.

Alternative considered: only tint the existing sprite. Rejected because the request calls for a distinct look per power and future power-specific assets should remain possible without redesigning the contract.

### 4. Gate shooter behavior before bullet creation
Shooter enemies should check camera visibility before entering their active fire cycle. If they are off-camera, they should not spawn bullets, advance bullet timing, or play bullet sounds. Once visible, they can resume normal firing and associated sound playback.

Alternative considered: spawn bullets off-camera but hide or mute them until visible. Rejected because it still performs unnecessary simulation and can produce timing drift or hidden side effects before the enemy enters view.

### 5. Keep audio behavior coupled to actual firing events
The bullet sound should remain tied to the firing event, not to a separate visibility timer. That preserves the existing audio contract while naturally suppressing sound when the shooter is not visible and not firing.

Alternative considered: add a separate audio visibility gate. Rejected because the firing gate already expresses the intended behavior and avoids redundant state.

## Risks / Trade-offs

- [Risk] Stricter block-placement validation may invalidate existing authored stages. → Mitigation: audit and adjust affected reward blocks during implementation, and surface clear validation errors.
- [Risk] Distinct player variants could become visually noisy if the color/asset set is too large. → Mitigation: keep the variants tightly bounded to the existing supported powers and reuse the base silhouette.
- [Risk] Camera visibility checks may differ between the render camera and gameplay bounds. → Mitigation: use the same camera/viewbox definition that drives enemy visibility elsewhere in gameplay.
- [Risk] Shooter gating could affect pacing if a level depended on off-screen pre-firing. → Mitigation: preserve normal behavior once visible and verify stage layouts still read correctly.

## Migration Plan

1. Update the HUD layout and binding so the primary bar renders only the core stats and the secondary text moves to the bottom-right.
2. Add or update stage validation for reward blocks against stompable grounded enemies, then fix any authored placements that fail the new rule.
3. Introduce the player power-to-appearance mapping and confirm each supported power resets cleanly on clear or respawn.
4. Gate shooter firing on camera visibility, then verify bullets and sounds do not appear before the enemy enters view.
5. Run stage playtests or automated checks to confirm the new HUD arrangement and progression safety are stable across the target stages.

Rollback is straightforward: restore the prior HUD layout, remove or relax the new block-placement rule, and disable the shooter visibility gate if a stage regression is found.

## Open Questions

- Should the run/segment label stay visible only during active gameplay, or also persist through stage transitions?
- Do the power variants need specific asset swaps for every power, or is a color-plus-overlay treatment sufficient for the MVP?
- Should block-placement validation hard-fail authored content, or warn in tooling while still allowing manual override for exceptional cases?
