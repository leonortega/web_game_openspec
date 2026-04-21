## Context

The current enclosed gravity-room rollout already has the right macro model: each room is enclosed, driven by one gravity field, gated by one interior disable button, and reset back to an active baseline on death, respawn, restart, or fresh stage start. The problem is narrower and more player-facing. The current validator can still accept some layouts when entry and exit technically exist but the route read is wrong because the room does not clearly play as IN from the left side and OUT from the right side.

Explore identified four current rooms in scope: `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule`. Explore also flagged the amber and sky anti-grav rooms as strong false-positive candidates, which means apply cannot rely on validation pass/fail alone as proof that the layout is correct.

This proposal intentionally stays at the artifact stage. It must leave implementation with a room-by-room contract that says what geometry remains part of the room, what doorway positions move, what yellow-marked arrangements must be removed, and what arrangements may remain only as non-doorway geometry.

## Goals / Non-Goals

**Goals:**
- Require implementation to start from a room-by-room proposal for all four current gravity rooms before code or authoring changes land.
- Define `IN` as left-side room entry and `OUT` as right-side room exit for every current gravity room in scope.
- Preserve the enclosed-room shell, linked gravity field, interior disable button, and retry/reset behavior already established by the current room model.
- State clearly that some current platforms or door arrangements may remain as geometry but must no longer count as doorway flow.
- Forbid helper ledges, doorway-only compliance platforms, and fake low bottom-door workarounds as ways to satisfy the IN/OUT contract.
- Make the anti-goal explicit: technically valid but experientially wrong player-facing flow is a failure.

**Non-Goals:**
- Redesign room shell mechanics, gravity physics, button interaction, or reset semantics.
- Introduce new room-local gimmicks, extra helper platforms, or alternate doorway semantics.
- Implement or verify the change in this stage.

## Decisions

### 1. Proposal must define room flow before code changes
Apply work must begin from a room-by-room proposal rather than from exploratory implementation. Each of the four rooms needs an explicit keep/remove/move/forbid contract so implementation does not preserve a technically valid but wrong doorway solution by accident.

Alternative considered: leave room-by-room decisions for apply after generic spec updates. Rejected because the user explicitly wants room-by-room proposal first and the current validator can produce false positives.

### 2. `IN` and `OUT` are side-aware player-facing semantics, not just validator labels
For this change, `IN` means the player enters the room from the left side of the room footprint and `OUT` means the player exits the room from the right side. A layout is wrong if the player-facing read still depends on the opposite side, a neutral bottom workaround, or a yellow-marked surrogate arrangement even when a pathfinder or reachability check can thread through it.

Alternative considered: treat IN/OUT as any reachable pair of openings. Rejected because that is the loophole causing current false positives.

### 3. Existing geometry may remain only if it stops acting as doorway flow
Some current door or platform arrangements may stay in the room if they still serve general room geometry, support, or visual structure. However, any yellow-marked current arrangement that is wrong for doorway flow must either be removed entirely or demoted so it no longer serves as the solution for entry or exit.

Alternative considered: remove every questioned piece of geometry categorically. Rejected because the user explicitly allows some geometry to remain so long as it no longer counts as doorway flow.

### 4. No helper ledges, doorway-only compliance platforms, or low-door cheats
Apply may move doors, move existing intended route supports, or repurpose current geometry, but it may not solve compliance by adding helper ledges, doorway-only micro-platforms, or a fake low bottom-door workaround that sidesteps the intended left-entry and right-exit read.

Alternative considered: permit narrow exception platforms for difficult rooms. Rejected because those additions recreate the same experiential defect under a new name.

### 5. Room-by-room semantics are explicit and binding
The four current rooms each need concrete authoring expectations:

#### `forest-anti-grav-canopy-room`
- Keep: enclosed shell, anti-grav field, interior disable button, current retry/reset behavior, and any existing route support that already belongs to the intended traversal path.
- Move: the `IN` doorway onto the existing left-side approach support and the `OUT` doorway onto the existing right-side reconnect support so the room reads left-to-right.
- Remove or demote: any yellow-marked current door/platform arrangement that currently acts as the doorway solution from the wrong side or from a neutral bottom workaround.
- Forbid: helper ledges, doorway-only compliance platforms, and fake lower-door fixes.

#### `amber-inversion-smelter-room`
- Keep: enclosed shell, gravity inversion field, interior disable button, current retry/reset behavior, and intended route supports already used by the room path.
- Move: the `IN` doorway to the left-side authored approach and the `OUT` doorway to the right-side authored reconnect, with any dependent route rectangles updated together.
- Remove or demote: the yellow-marked current arrangement if it still reads as the doorway answer after the move, even if some of its geometry remains nearby.
- Forbid: helper ledges, doorway-only micro-support, and any low-door compromise that lets validation pass while player flow still feels wrong.

#### `sky-anti-grav-capsule`
- Keep: enclosed capsule shell, anti-grav field, interior disable button, current retry/reset behavior, and any existing support already part of the intended route.
- Move: the `IN` doorway to the left-side supported approach and the `OUT` doorway to the right-side reconnect so the room no longer reads as a false-positive pass.
- Remove or demote: the yellow-marked current door/platform answer if it currently solves room flow from the wrong side or through a doorway-only arrangement.
- Forbid: helper ledges, doorway-only compliance platforms, fake low bottom-door routing, and any solution that keeps the old wrong read under a technically valid layout.

#### `sky-gravity-inversion-capsule`
- Keep: enclosed capsule shell, inversion field, interior disable button, current retry/reset behavior, and any intended route support that already belongs to the authored room path.
- Move: the `IN` doorway to the left-side room approach and the `OUT` doorway to the right-side reconnect, including any dependent route rectangle or shell-opening updates.
- Remove or demote: any yellow-marked current arrangement that still functions as a doorway solution after the move.
- Forbid: helper ledges, doorway-only support, and bottom-door cheats that flatten the intended left-to-right room read.

### 6. Validation must reject experiential false positives
Validation and test coverage should not only ask whether doors are reachable. They must reject current-room layouts when the player-facing flow still enters from the wrong side, exits from the wrong side, or depends on forbidden workaround geometry. The anti-goal is explicit: a code/spec pass with wrong player-facing flow is still failure.

Alternative considered: leave experiential flow to manual playtest only. Rejected because the known defect is that current validation can approve the wrong answer.

## Risks / Trade-offs

- Room-specific wording can become too vague to guide apply. -> Keep each room's keep/remove/move/forbid semantics explicit and tie them to the four named rooms.
- Over-specifying geometry could invent details not yet confirmed by implementation. -> Bind the side-aware flow and forbidden workaround patterns while allowing exact door coordinates to be resolved during apply.
- Validation changes may still miss subtle experiential wrongness. -> Require focused tests and playtests that treat wrong player-facing flow as a blocking failure, not a cosmetic warning.

## Migration Plan

1. Update `platform-variation` and `stage-progression` deltas with the room-by-room IN/OUT contract.
2. Implement validation and authoring changes room by room, starting with the four named current gravity rooms.
3. Re-author or demote wrong yellow-marked doorway solutions while preserving the enclosed-room model, gravity field, disable button, and reset behavior.
4. Run focused validation and playtests that confirm each room reads as left-entry and right-exit without helper platforms or low-door cheats.

## Open Questions

None. The proposal is apply-ready as long as implementation follows the explicit room-by-room keep/remove/move/forbid semantics and treats wrong player-facing IN/OUT flow as blocking.