## Context

Enclosed gravity rooms currently preserve the normal upward player jump takeoff while the room field only bends later airborne acceleration. That behavior was intentional in the last gravity-room rollout, but it now conflicts with the requested mechanic for active rooms. The change has to update controller semantics, room authoring expectations, and validation together because button-route reachability currently assumes the opposite rule.

This proposal stays narrow. It applies only to enclosed gravity rooms while their linked field remains active. It must not broaden into a global gravity inversion rewrite, enemy gravity change, or a new room-toggle interaction model.

## Goals / Non-Goals

**Goals:**
- Redefine active enclosed gravity rooms so player jump initiation from valid room support uses an inverse takeoff while the room field is active.
- Restore normal jump behavior immediately when that room field is disabled or when the player is outside the active room state.
- Keep the mechanic player-only and preserve existing enemy gravity, launcher behavior, dash behavior, and non-room gravity-field rules.
- Update gravity-room validation and authored readability expectations so active-field button routes remain reachable under inverse jump semantics.

**Non-Goals:**
- Global gravity inversion across all gravity fields.
- Ceiling walking, inverted grounded support, or enemy jump and gravity changes.
- Replacing room disable buttons with a new interact flow, jump-triggered field toggle, or other room-state system.
- Rewriting launcher, spring, or dash impulses to mimic the inverse room jump.

## Decisions

### 1. Inverse jump scope is limited to supported player jump initiation inside active enclosed gravity rooms
Only player jump initiation that starts from valid support inside an enclosed gravity room with an active linked field uses the inverse takeoff. That same room-scoped rule also covers buffered jump resolution and coyote-time jump resolution when the source support came from the active room. Double jump, spring launch, bounce pod, gas vent, dash, and non-room gravity fields keep their current semantics.

Alternative considered: invert every player jump impulse whenever any gravity effect is active. Rejected because that would broaden the mechanic into a global controller rewrite and conflict with the requested room-only scope.

### 2. Room inverse takeoff composes with the existing room field instead of replacing it
The active room still applies its linked anti-grav or inversion airborne rule after the inverse takeoff begins. The change is therefore a room-specific takeoff rule layered onto the existing room field, not a replacement of the room field itself.

Alternative considered: replace the room field with inverse jump only. Rejected because the user asked for inverse jump while the gravity effect is on, not for removal of the active room field behavior.

### 3. Disabled rooms immediately return to normal jump semantics
The existing room disable state remains the single gate. Once the player triggers the linked interior disable button, grounded jump initiation inside that room returns to the normal upward takeoff on the same behavioral boundary that already turns the room field off.

Alternative considered: keep inverse jump active until the player leaves the room even after disable. Rejected because it would make the disabled room feel inconsistent and would violate the requested "gravity effect off means normal jump" rule.

### 4. Validation must evaluate active-room reachability under inverse jump semantics
Gravity-room validation and authored expectations must treat inverse takeoff as the active-room baseline. Button placement, side supports, and interior route geometry should be accepted only when the player can read and complete the active-field route using inverse jump semantics without validator-only helper supports, misleading dead arcs, or enemy blocking that replaces the intended deactivation lane.

Alternative considered: leave validation unchanged and fix only runtime behavior. Rejected because current validation logic and authoring assumptions explicitly encode the opposite readability rule.

## Risks / Trade-offs

- [Route regression] Existing gravity-room layouts may no longer be reachable once active-room jumps reverse direction. -> Mitigation: require validation and focused playtest coverage for active-field button reachability and readable route flow.
- [Scope creep] Inverse jump logic could accidentally affect open gravity fields or other airborne mechanics. -> Mitigation: bind the rule to enclosed-room active state plus supported player jump initiation only.
- [Controller ordering risk] Buffered and coyote jumps may diverge from grounded active-room jumps if the support-source check is incomplete. -> Mitigation: require automated coverage for grounded, buffered, and coyote jump initiation inside active and disabled rooms.
- [Readability risk] Interior enemies or support geometry may make inverse routes feel arbitrary. -> Mitigation: reject authored rooms whose only button path becomes unreadable or blocked under inverse jump semantics.

## Migration Plan

1. Update the gravity-room capability deltas in `platform-variation`, `player-controller`, and `stage-progression` to define inverse jump as the active-room contract.
2. During apply, update simulation room-state checks so supported player jump initiation inside active enclosed gravity rooms uses the inverse takeoff while disabled rooms stay normal.
3. Update stage catalog and validation expectations so active-room layouts remain readable and reachable with inverse jump semantics.
4. Add automated and focused playtest coverage for active-room inverse jump, disabled-room normal jump restoration, and unchanged enemy gravity behavior.

## Open Questions

No apply blocker remains. Final jump-strength tuning and any required room-layout adjustments can be decided during apply as long as the implementation preserves room-only scope, disabled-room normal jump restoration, and active-field route readability.