## Context

Current enclosed gravity rooms already have shell rectangles, bottom entry and exit door openings, linked interior buttons, and route-local content, but the contract still leaves two gaps. First, containment is described mainly from the player's perspective, so authored or runtime enemy and platform movement can appear to pass through sealed shell bands. Second, door reachability is defined only at route-segment level, which allows bottom doors to be technically present on a route while still lacking clear usable footing for approach, landing, and jump continuation.

This change stays within the existing gravity-room model. It should tighten validation and runtime expectations around the current shell-plus-door schema instead of creating a new room geometry system.

## Goals / Non-Goals

**Goals:**
- Treat sealed gravity-room shell bands as containment boundaries for traversable and hostile content, not only for the player body.
- Require explicit stable local footing at both bottom door openings so room entry and exit remain readable and usable.
- Make the new contract precise enough that stage validation, unit tests, and playtests can reject shell intrusion and unsupported door placement deterministically.

**Non-Goals:**
- Introduce new gravity-room state, new collision geometry types, or new door interaction mechanics.
- Change gravity-field controller semantics, disable-button semantics, or overall stage progression flow.
- Generalize containment into arbitrary physics occlusion for all stage objects outside gravity rooms.

## Decisions

### 1. Keep shell and door rectangles as the authoritative containment geometry
Implementation should continue to derive enclosed-room boundaries from each room's existing shell, entry door, and exit door rectangles. The follow-up change tightens how those authored shapes are interpreted: shell bands outside door openings are sealed, and only door openings may connect room and non-room space.

Alternative considered: add explicit wall segments or a second containment mask for each room. Rejected because it duplicates existing authored geometry and would make validation and maintenance harder.

### 2. Define containment as a shared authoring and runtime contract
The requirement should cover both authoring and runtime behavior. Validation must reject stages whose external moving-platform paths, enemy patrol volumes, or other traversable content intrude through sealed shell bands, and runtime tests should confirm the shell also blocks accidental cross-shell movement that survives authoring.

Alternative considered: keep containment purely as authoring guidance. Rejected because the reported bug includes runtime trespass, so the contract must be enforceable beyond static data review.

### 3. Define door usability through explicit local footing, not only route membership
Each bottom door opening should require stable support geometry that gives the player a readable place to stand, enter, leave, and initiate the next jump or traversal beat. Validation should reason about adjacent authored footing near the door rather than accepting any door that merely overlaps a broader reachable route envelope.

Alternative considered: keep the current route-segment requirement and rely on playtesting to catch unsupported doors. Rejected because the defect is exactly that route-level reachability is too weak to prevent inaccessible bottom doors.

### 4. Scope intrusion checks to sealed wall bands, not full-room exclusion zones
The follow-up should ban crossing or overlapping sealed shell wall bands outside the authored door openings. It should not forbid nearby exterior content elsewhere in the stage so long as that content stays outside the room or uses a valid door opening.

Alternative considered: ban any enemy or platform near a gravity room shell. Rejected because it would over-constrain stage layout and solve a broader problem than the reported defect.

## Risks / Trade-offs

- Legacy rooms may fail new door-footing checks even if they were previously considered reachable. → Tighten validation with explicit support heuristics and re-author only the affected room-local geometry.
- Runtime containment checks may expose moving-platform or enemy behaviors that were implicitly tolerated. → Keep the rule focused on sealed shell bands and add targeted tests around crossing behavior.
- Door-footing rules can become brittle if they overfit one platform shape. → Phrase the requirement around usable stable support rather than one exact geometry pattern.

## Migration Plan

1. Update the gravity-room requirements to define sealed shell-band containment and explicit door footing.
2. Extend stage validation to reject shell-band intrusion and unsupported bottom door openings.
3. Adjust stage authoring and builders where needed so affected rooms satisfy the new contract.
4. Add unit and scripted coverage for shell-band containment and door-footing behavior.

## Open Questions

None. The follow-up scope is specific enough to proceed.