## Context

The archived enclosed-gravity-room change established the room mechanic itself, and the current runtime already supports active-by-default rooms with an interior disable button. The remaining gap is rollout and enforcement: Verdant Impact Crater still uses one open anti-grav field, Ember Rift Warrens still uses one open inversion field, and Halo Spire Array still mixes one enclosed room with one open inversion field. The user direction for this follow-up is explicit: treat all current playable stages as in scope, convert every authored gravity-modification section to an enclosed room, keep the room fully enclosed except for separate bottom entry and exit doors, and preserve route readability with strong containment and visual-language rules.

This is still a propose-stage-only change, but it is cross-cutting enough to need a design artifact because apply will touch authored stage data, validation, runtime coverage, scene presentation, and scripted playtests.

## Goals / Non-Goals

**Goals:**
- Convert every authored anti-grav stream and gravity inversion column in Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array into an enclosed gravity room section.
- Keep the existing active-by-default, interior-disable-button mechanic semantics and apply them consistently across the full rollout.
- Require each room to be fully enclosed except for one bottom entry opening and one separate bottom exit opening.
- Enforce room size and containment so platforms, enemies, hazards, pickups, button placement, and intended routes all fit fully inside the shell and stay reachable.
- Lock the room-local visual language for apply: blue outlined shell, black room platforms, red enemies, yellow interior disable button.

**Non-Goals:**
- Introduce a new gravity mechanic, generalized room framework, or broader puzzle-room state model.
- Change jump, dash, launcher, grounded, or non-player gravity semantics.
- Add new HUD prompts, interact inputs, hold-to-disable logic, or re-enable behavior.
- Expand scope beyond the current playable stages or beyond authored gravity-modification sections.

## Decisions

### Treat all current authored gravity fields as migration targets for one-room-per-field rollout
Apply should convert every currently authored anti-grav stream and gravity inversion column in the three playable stages into exactly one enclosed gravity room section. This keeps the rollout requirement concrete and prevents a partial implementation that leaves legacy open-field exceptions behind.

Alternative considered: only update the primary gravity section in each stage and leave secondary open sections unchanged. Rejected because the handoff explicitly calls for all gravity modification sections in all current playable stages.

### Keep the existing room runtime semantics and focus implementation on authoring, validation, and presentation
Because runtime and schema already support active-by-default enclosed rooms with an interior disable button, apply should reuse that behavior instead of reopening the mechanic contract. The implementation emphasis belongs on stage data conversion, stronger validation, readable visuals, and regression coverage.

Alternative considered: reopen the mechanic to add new state or toggling behavior while doing the rollout. Rejected because it adds risk without addressing the actual gap.

### Validate room size and reachability from the authored-data layer
Every room should pass validation only if the shell fully contains the field, room-local supports, enemies, hazards, pickups, and the disable button, and only if the intended route through the room remains reachable from the bottom entry to the bottom exit in both active and disabled traversal states where required. This should catch cropped or unreachable rooms before runtime use.

Alternative considered: rely on manual playtest only for room-size and reachability issues. Rejected because these are predictable authoring failures and should fail deterministically.

### Make the rollout visibly consistent through room-local color roles, not just shell geometry
The room shell should use a blue outline, room-local platforms should read black, room-local enemies should read red, and the interior disable button should read yellow. This gives apply a concrete visual-language target that matches the requested traversal-category readability while keeping the room distinct from stage exits.

Alternative considered: leave color treatment to implementation taste as long as rooms remain readable. Rejected because the user gave explicit visual-direction requirements and wants stronger rollout consistency.

## Risks / Trade-offs

- [Authoring density] Converting every current gravity field into a room can crowd stage layouts if shell size is too small. -> Mitigation: validation must reject rooms that crop or compress intended route content.
- [Coverage drift] Runtime already supports the mechanic, so rollout regressions could hide in content or presentation instead of simulation logic. -> Mitigation: require authored-data tests plus scripted playtest coverage for each stage family and at least one room-state transition path.
- [Visual confusion] Blue room shells and black platforms could still drift toward exit or neutral support language if local accents are inconsistent. -> Mitigation: keep door roles, shell outline, red enemies, and yellow button as a fixed room-local palette contract.
- [Partial migration risk] A single untouched open gravity field would violate the user request but could slip through if validation checks only room internals. -> Mitigation: validation must also assert that every authored anti-grav and inversion section in current playable stages belongs to an enclosed room.

## Migration Plan

1. Update the proposal-linked spec deltas so rollout, validation, controller scope, and visual-language rules are explicit.
2. In apply, convert all current playable stage gravity sections to enclosed rooms and revise room-local geometry so content fits cleanly inside each shell.
3. In apply, extend validation and tests to reject any remaining open gravity section or any enclosed room that crops or blocks its intended route.
4. In apply, update scene presentation and scripted playtests so the new full-room rollout is readable and regression-resistant.

## Open Questions

None for apply readiness. The handoff resolves the main ambiguity by fixing the target set to all current playable stages and all authored gravity-modification sections.