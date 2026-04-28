## Context

The recent gravity-room work already established the enclosed shell, full-room player gravity volume, contained interior enemies, side-wall `IN`-left and `OUT`-right flow, contact-based disable button, and retry reset behavior. The remaining defect is narrower and more player-facing: some active gravity rooms can still be authored so the button-deactivation beat reads poorly or feels unreachable while the field is on, especially once interior enemies are added to the same space.

The user report that jumps feel downward inside gravity rooms is useful because it points at the missing contract boundary. The system already intends to preserve normal jump impulse and apply room gravity only after takeoff, but the current specs do not yet require authored room geometry, button placement, and enemy placement to preserve that read. This change therefore needs to align controller expectations, room authoring rules, and stage validation so apply work fixes the root issue instead of adding a one-off helper platform or loosening validation.

## Goals / Non-Goals

**Goals:**
- Make the expected player-facing behavior explicit: active room gravity bends the airborne arc after takeoff, but the player still reaches the interior disable button using the existing jump and contact flow.
- Define authoring and validation rules that reject gravity-room layouts whose button route is unreadable, effectively unreachable, or only solvable with a dedicated compliance-only support piece.
- Allow contained interior enemies only when they remain room-local and do not crowd, pin, or replace the intended deactivation route.
- Preserve all settled gravity-room constraints: enclosed shell, side-wall flow, player-only gravity effect, contact-based disable, and reset semantics.

**Non-Goals:**
- Add a new interact key, jump-triggered gravity toggle, or enemy gravity rewrite.
- Move the disable button outside the gravity-room beat or solve reachability by adding validator-only helper platforms.
- Reopen bottom-edge doorway layouts, generalized room-state logic, or other unrelated gravity mechanic changes.

## Decisions

### 1. Treat button reachability under active room gravity as a first-class requirement
The room contract should state that the player can enter an active enclosed gravity room, use the current jump behavior, and reach the linked interior disable button before the room is disabled. This closes the spec gap between controller semantics and room authoring.

Alternative considered: keep controller rules unchanged and solve the issue only through per-room tuning. Rejected because the defect is a missing contract, not a one-room exception.

### 2. Define the movement read around the reported downward-feeling jump
The proposal should resolve the ambiguity by making the expected read explicit: active room gravity may redirect the airborne arc after takeoff according to the room type, but it must not replace jump takeoff with an immediate opposite-direction shove from support or otherwise make the intended button route feel backwards. This keeps the settled impulse-first controller rule and makes room authoring accountable for button access.

Alternative considered: treat any downward-feeling jump inside a gravity room as automatically intentional for inversion rooms. Rejected because that leaves button access ambiguous and does not match the existing impulse-first controller contract.

### 3. Make contained enemies subordinate to the button route
Interior enemies remain valid only when they are room-local encounters layered onto the gravity-room beat instead of replacing it. Authoring and validation should therefore reject rooms where enemy placement blocks the only intended button approach, forces unavoidable damage on the deactivation lane, or obscures the readable route to the button.

Alternative considered: allow any contained enemy placement as long as enemies cannot cross the room boundary. Rejected because containment alone does not preserve room readability or deactivation access.

### 4. Keep the fix bounded to existing room structure and inputs
Implementation should preserve the interior button, side-wall door flow, and current jump plus contact interaction rules. Reachability fixes must come from room layout, route geometry, button placement, and room-local encounter spacing instead of introducing new control affordances or moving the button outside the room challenge.

Alternative considered: add a new trigger mode, move the button to a safer non-room location, or disable room gravity when the player jumps. Rejected because each option changes the mechanic instead of clarifying and enforcing the intended one.

### 5. Validate with both authoring checks and focused gameplay evidence
Authoring validation can reject obviously bad geometry, button placement, and enemy spacing, but it cannot fully prove player feel. Apply work should therefore pair validation updates with focused runtime tests and room-specific playtests that show the player can jump, reach the button, and disable the room while contained enemies remain readable.

Alternative considered: rely on playtesting alone. Rejected because preventable authoring defects should fail before runtime.

## Risks / Trade-offs

- Reachability could be specified too vaguely and still allow rooms that technically pass but feel wrong. → Anchor the requirement to normal jump takeoff, active-field button reachability, and readable intended route semantics.
- Enemy placement rules could become so strict that interior encounters are effectively banned again. → Keep the rule focused on preserving the button route rather than banning enemies by default.
- Validation may still miss some runtime crowding or knockback cases. → Require focused game-session tests and playtest evidence in addition to authoring validation.
- Implementation may be tempted to add a one-off helper platform for one room. → State explicitly that compliance-only support pieces are invalid for this fix.

## Migration Plan

1. Update the gravity-room deltas in `player-controller`, `platform-variation`, and `stage-progression` so active-field button reachability and readable contained-enemy placement are normative.
2. During apply, update gravity-room authoring data, validators, and any room-layout helpers so each active room keeps a reachable interior button route without helper-only support geometry.
3. Update runtime or playtest harness coverage to prove the player can still jump, contact the button, and clear the room while interior enemies remain contained and non-obstructive.
4. Re-author any current gravity room that fails the new reachability or readability rules while preserving enclosed shell, side-wall flow, and reset semantics.

## Open Questions

None. The change is apply-ready if implementation preserves the existing mechanic and fixes active-room button reachability through authoring, validation, and focused evidence rather than through new controls or fake support.