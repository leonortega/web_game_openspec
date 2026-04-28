## Why

Moving-support play currently breaks a core readability rule: when a platform clears away from under the player, the player is shoved to the former support's edge before falling because that same support is immediately reprocessed as a horizontal blocker on the detach update. This makes moving-platform traversal feel unfair and obscures the player's true occupied position, so the detach behavior should be tightened before more traversal content depends on it.

## What Changes

- Preserve the player's occupied position on the update where authored support motion ends top-surface contact and the player transitions into a fall.
- Exempt only the former support body from same-frame horizontal collision resolution on that detach update so ordinary wall collisions still behave normally.
- Add focused simulation coverage for detach-from-support cases to prevent regressions in moving-platform and falling-support traversal.
- Document that this change must not broaden into tolerance-only collision hacks or alter jump, coyote-time, dash, gravity-field, or falling-platform semantics outside the single detach frame.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: Clarify that moving platforms must let the player fall from their occupied position when support motion ends, without same-frame edge shoving from the former support.
- `player-controller`: Define a detach-frame collision exemption for the former support only, while preserving normal side-collision and movement rules elsewhere.

## Impact

- Affects support retention, support-motion carry, and horizontal collision resolution in `src/game/simulation/GameSession.ts`.
- Affects simulation regression coverage in `src/game/simulation/GameSession.test.ts`.
- Affects OpenSpec behavior contracts in `openspec/specs/platform-variation/spec.md` and `openspec/specs/player-controller/spec.md`.