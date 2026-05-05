## Context

The current main specs already require deliberate route continuation and prohibit dedicated helper platforms for the enclosed gravity-room rollout, but the latest validation posture still accepts cases that only prove nearby support or local overlap at the doorway. The user requires stricter semantics for the current playable gravity rooms: the player must actually use a platform path to enter the room, and the exit door must actually land back onto a platform path after the room.

This follow-up is scoped to the known current gravity rooms: `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule`. Those rooms may need coordinated edits to door positions, nearby route-support platforms, and related route rectangles so authored data and validation describe the same traversal path. Runtime behavior should remain unchanged unless the validator or authoring model needs a minimal extension to distinguish real route support from compliance-only geometry.

## Goals / Non-Goals

**Goals:**
- Encode platform-path continuity as the acceptance rule for current gravity-room entry and exit doors.
- Preserve the existing allowance for moving-platform doorway support when that platform is genuine route support rather than a compliance-only helper.
- Make apply treat door movement, related route-support geometry, and dependent route rectangles as one coordinated authoring update per affected room.
- Keep implementation scope limited to the current gravity-room rollout unless focused validation exposes the same defect class in another current room.

**Non-Goals:**
- Redesign gravity-room runtime activation, shell presentation, or player-controller behavior.
- Expand the room system into generalized pathfinding, new door mechanics, or new support-platform categories.
- Re-author unrelated stages or non-gravity routes.

## Decisions

### 1. Define continuity at the platform-path level, not the local-overlap level
Validation and authored data should prove more than doorway adjacency. Entry continuity means the intended route reaches a usable platform support that carries the player into the doorway. Exit continuity means the player leaves the doorway onto a usable platform path that continues progression. This captures the user requirement directly and closes the gap left by support-name or overlap-only checks.

Alternative considered: tighten support-distance thresholds only. Rejected because proximity still allows floating or awkward doors that are technically near support but not part of a readable route.

### 2. Keep fixed and moving supports valid only when they are real route support
The requirement should stay neutral on support type. A moving platform may satisfy entry or exit continuity if it already serves as intended route support for approach, landing, grounded traversal, or jump setup. A platform or ledge added only to satisfy a doorway check must remain invalid.

Alternative considered: require fixed support only. Rejected because the existing rollout and specs intentionally allow moving-platform doorway support where it reads as part of the authored route.

### 3. Treat door updates, nearby platforms, and route rectangles as one authoring unit
Door continuity depends on more than door coordinates. Apply should expect coordinated updates to door openings, nearby route-support platforms where needed, and any route rectangles or reconnect geometry that still point to the old route shape. This is especially important in the two sky rooms, where door positions and local route segments are tightly packed.

Alternative considered: limit implementation to validation changes. Rejected because stricter validation alone would likely fail existing room data without documenting the required coordinated authoring updates.

### 4. Keep runtime scope minimal unless authoring or validation cannot express continuity without it
This change is primarily about authoring semantics and validation. Implementation should avoid runtime behavior changes unless a small data-model or builder adjustment is necessary to represent route continuity clearly enough for validation and tests.

Alternative considered: introduce new runtime door-state or path markers. Rejected because the problem is authored route continuity, not runtime interaction behavior.

## Risks / Trade-offs

- Sky room continuity may still validate while feeling awkward at play speed. -> Verify with focused traversal playtests, not only unit coverage.
- Distinguishing real route support from compliance-only support may rely partly on authored route rectangles and support membership. -> Update validation and fixtures together so the rule is explicit and testable.
- Coordinated room edits could drift beyond the intended scope if multiple nearby route elements fail once the stricter rule is applied. -> Limit authoring changes to the four known rooms unless the same defect class appears elsewhere during focused validation.

## Migration Plan

1. Update the `platform-variation` and `stage-progression` spec deltas to encode platform-path continuity semantics for the current gravity-room rollout.
2. Adjust the stage authoring and validation model only as needed to distinguish real doorway route continuity from compliance-only support overlap.
3. Re-author `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` with coordinated door, support, and route-rectangle updates.
4. Run focused automated coverage and gravity-room traversal playtests to confirm the four rooms remain cleanly traversable with no helper-only platforms.

## Open Questions

None. The change can proceed with the current room model and a validation-first interpretation of platform-path continuity.