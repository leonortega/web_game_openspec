## Context

This proposal follows the recent gravity-room containment and side-wall flow changes. Those changes established the enclosed shell, sealed bottom edge, side-wall entry and exit, interior disable button, and retry reset behavior. They did not finish two related pieces of behavior that now need to move together.

First, the room's gravity effect still reads and behaves like a smaller field placed inside the room rather than the room itself being the gravity-modified traversal volume. The intended behavior for enclosed gravity rooms is stronger: while active, the room's anti-grav or inversion rule should apply anywhere inside the room interior that the player can traverse.

Second, existing validation pressure trends toward a blanket ban on enemies inside gravity rooms. That is broader than necessary and conflicts with the intended room model. The desired rule is not "no enemies in rooms". The desired rule is "enemies may be authored inside rooms, but room interior and room exterior are separate enemy-containment domains." A contained inside enemy should remain a room-local encounter, and an outside enemy should remain outside even when the player can pass through the side-wall doors.

This proposal keeps the already-set constraints from explore: the effect remains player-only, the side-wall door flow remains intact, shell space outside authored doors remains sealed, and retry semantics remain unchanged. The proposal also keeps the earlier historical direction from `2026-04-13-gravity-columns-and-antigrav-streams` and `2026-04-20-tighten-gravity-room-containment-and-door-footing`, but updates them so implementation does not stop at shell-band blocking or remove enemies from rooms to satisfy validation.

## Goals / Non-Goals

**Goals:**
- Define enclosed gravity rooms so the active room effect uses the full interior play volume instead of a smaller authored sub-rectangle.
- Keep gravity-room controller behavior player-only and impulse-first, with no enemy gravity rewrite.
- Replace the effective ban on enemies inside gravity rooms with a containment rule that allows authored interior enemies while keeping them inside.
- Require the same containment rule at side-wall doors so outside enemies cannot enter and inside enemies cannot leave, even though the player can cross those doors.
- Keep the current side-wall room flow, sealed shell model, and retry or reset behavior unchanged.

**Non-Goals:**
- Add gravity effects for enemies, hazards, or projectiles.
- Reopen bottom-door layouts, shell-band-only loopholes, or visuals-only room resizing.
- Solve the change by removing enemies from rooms or by leaving containment as a spec-only statement without validation and runtime coverage.
- Introduce generalized room-state logic beyond the existing active-versus-disabled room field behavior.

## Decisions

### 1. The room interior, not a smaller inner field rectangle, is the active gravity volume
When an enclosed gravity room is active, its linked anti-grav or inversion rule applies anywhere inside the room's interior play volume rather than only inside a smaller interior field rectangle. The room shell and side-wall openings still bound the room physically, but the gravity-modified airborne space is the room itself.

Alternative considered: resize or move the existing inner field rectangle while keeping partial-room coverage. Rejected because it preserves the same readability problem under a different rectangle.

### 2. Player-only gravity modification remains unchanged
The room-wide field still modifies only the player's ongoing airborne vertical acceleration. It does not change enemy gravity, grounded support orientation, horizontal force rules, or generalized vector physics.

Alternative considered: let enemies inside the room inherit the same gravity rule for consistency. Rejected because explore explicitly called out that enemy gravity should remain unchanged and current gravity mechanics are intentionally player-only.

### 3. Interior enemies are allowed, but room boundaries are enemy-containment gates
An enclosed gravity room may include authored enemies inside the room. Those enemies are valid room-local content only when their movement, knockback, patrol, and recovery behavior remain contained to the room interior. The room's shell bands and side-wall doors must therefore act as enemy-containment boundaries even though the player can traverse the doors.

Alternative considered: keep banning enemies inside gravity rooms. Rejected because it solves the wrong problem and removes intentional encounter design from enclosed rooms.

### 4. Enemy containment is independent of field enabled state
Enemy containment is part of the room boundary contract, not part of the active field effect. Inside enemies must stay inside and outside enemies must stay outside whether the room field is active, has been disabled by the button, or has been reset after death or restart.

Alternative considered: enforce enemy containment only while the field is active. Rejected because that would make door behavior change unpredictably after button use and would reopen the same boundary defect.

### 5. Validation must replace the current ban with side-assignment checks
Validation should no longer reject a room simply because an enemy exists inside it. Instead, validation should reject authored data when enemy placement or authored motion implies transfer between room interior and room exterior, or when the room setup depends on shell-band-only blocking that still leaves doors enemy-passable.

Alternative considered: rely on runtime collision fixes alone. Rejected because authoring should fail before runtime when a room is clearly set up to violate containment.

### 6. Apply work should touch authoring, runtime, and coverage together
This change requires coordinated updates across stage data structures, builders and validation, game-session room logic, and focused tests. A spec-only update is not acceptable because the existing defect is partly in validation and partly in runtime interpretation.

Alternative considered: implement runtime behavior first and defer spec or validation updates. Rejected because the user explicitly requested apply-ready artifacts with exact implementation and evidence requirements.

## Risks / Trade-offs

- Full-room gravity volume could accidentally broaden beyond the intended room interior if implementation uses shell bounds without respecting the traversable interior. -> Keep the requirement anchored to the enclosed room's interior play volume.
- Allowing enemies inside rooms could be misread as allowing any enemy to cross a room door. -> State explicitly that door openings remain enemy-containment gates.
- Validation may not fully predict dynamic enemy motion or knockback escapes. -> Require focused runtime tests in `GameSession` in addition to authoring validation.
- Existing rooms or tests may encode a no-enemies-in-room assumption. -> Call out the removal of that ban as an explicit implementation task and test update.

## Migration Plan

1. Update `platform-variation`, `player-controller`, and `stage-progression` deltas to define full-room player gravity coverage and enemy boundary containment.
2. Update stage content types, builders, and catalog ingestion so enclosed gravity rooms expose the full interior field contract and permit contained room-local enemies.
3. Update validation so interior enemies are allowed only when they remain assigned to the room interior and cannot transfer across shell bands or side-wall doors.
4. Update game-session and scene bootstrap behavior so room-local enemy containment and full-room player gravity coverage hold during active and disabled room states.
5. Run focused automated tests and playtests proving that player gravity covers the full room while enemies remain on their authored side of the room boundary.

## Open Questions

None. The change is apply-ready as long as implementation preserves the existing player-only gravity model, side-wall room flow, sealed-shell boundaries, and retry semantics while replacing the enemy-inside ban with explicit interior-versus-exterior containment.