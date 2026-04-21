## Context

The previous gravity-room follow-up established sealed shell-band containment and required usable door footing, and that language is now present in the main `platform-variation` and `stage-progression` specs. The remaining defect is narrower: those requirements still treat bottom entry and bottom exit doors as interchangeable openings with generic support, so validation can accept rooms whose reachable support exists on the wrong side of the doorway.

This change is intentionally limited to the existing bounded-room model. The room shell, door rectangles, disable button, and route-local geometry remain the authoritative authored inputs. The implementation should tighten how validation interprets entry versus exit doors and then re-author the known failing rooms to satisfy that stricter contract.

## Goals / Non-Goals

**Goals:**
- Define side-aware semantics for enclosed gravity-room doors so entry and exit openings are validated against different route expectations.
- Tighten authored validation enough to reject rooms that satisfy generic footing but fail correct-side reachability.
- Re-author the affected room data so the current stages satisfy the stricter contract without changing room-state behavior.
- Add focused automated coverage for side-aware validation and the known room layouts.

**Non-Goals:**
- Redesign runtime shell blocking, gravity-field behavior, or disable-button interaction.
- Introduce new room geometry primitives, extra authored wall segments, or new door interaction mechanics.
- Generalize this into arbitrary bidirectional route solving for every stage doorway outside enclosed gravity rooms.

## Decisions

### 1. Validate doors by authored role, not by interchangeable doorway support
Validation should continue using the current entry-door and exit-door identities from the room authoring schema. The entry door must prove reachable approach from the exterior-side route into the room, while the exit door must prove reachable approach from the room interior and a usable reconnect on the exterior exit side after crossing the opening.

Alternative considered: keep one generic door-footing rule and infer intent from nearby route shapes. Rejected because the bug exists specifically when generic support is present but the intended side is wrong.

### 2. Preserve current bounded-room geometry and runtime shell behavior
The room shell, bottom door openings, and existing shell blocking stay as they are. This follow-up only refines the validation contract and corresponding stage data so authored rooms line up with the bounded-room semantics already in place.

Alternative considered: add runtime-only corrections or new collision helpers to force side-correct traversal. Rejected because the reported failures come from authored layout acceptance, not from missing shell collision.

### 3. Express exit success as two checks: interior access and exterior reconnect
Exit-door validation should remain stricter than entry-door validation. A valid exit must be reachable from the intended interior route while the room is still traversed as authored, and it must land or reconnect onto usable exterior-side support once the player leaves the room.

Alternative considered: require only interior reachability and assume the outside reconnect is covered elsewhere. Rejected because the defect includes exits that technically leave the room but reconnect into unusable or wrong-side space.

### 4. Re-author only the identified rooms in this change
Implementation should limit stage-data updates to `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` unless validation exposes another directly related failure during apply.

Alternative considered: perform a broad gravity-room aesthetic refresh while touching the data. Rejected because that would expand scope beyond the side-aware access bug.

## Risks / Trade-offs

- Moving-platform door support can satisfy one side of a doorway while obscuring the other side. -> Keep validation explicit about which side each check evaluates and add tests that cover moving-platform-supported doors.
- Tightened rules may expose more authored rooms than the explore handoff identified. -> Start with the four named rooms, then treat any additional failures from the same validation pass as directly related follow-up within apply.
- Exterior reconnect heuristics can become brittle if they depend on one exact platform arrangement. -> Phrase and implement the rule around usable route support near the exit side rather than a single geometry pattern.

## Migration Plan

1. Update the gravity-room requirements to describe side-aware entry and exit access.
2. Tighten validation and tests around correct-side door reachability.
3. Re-author the four affected rooms to satisfy the new rule.
4. Run focused stage-data and unit coverage to confirm the stricter validation accepts the corrected layouts.

## Open Questions

None. The change can proceed with the current room model and the identified room list.