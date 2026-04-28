## Why

Active enclosed gravity rooms currently keep normal upward jump takeoff and only bend the airborne arc after takeoff. That conflicts with the requested room behavior and weakens the read of an active room as a distinct traversal state. This change is needed now to deliberately redefine enclosed gravity-room jumping without broadening gravity inversion into a global controller rewrite.

## What Changes

- Redefine active enclosed gravity rooms so a grounded player jump inside the room uses an inverse takeoff that launches from up to down while the linked room field remains active.
- Keep normal upward jump behavior everywhere else, including inside the same room after its linked disable button turns the room field off.
- Preserve the current player-only gravity boundary for enclosed gravity rooms and do not change enemy gravity, enemy jump behavior, or non-room gravity-field rules.
- Update controller ordering so the inverse room jump applies only to supported player jump initiation inside active enclosed gravity rooms and does not become a global gravity-inversion rewrite, a jump-triggered field toggle, or a generic impulse replacement outside that room scope.
- Update gravity-room authoring and validation expectations so active-field button routes, support geometry, and room readability remain reachable and understandable under inverse jump semantics.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: enclosed gravity rooms now use inverse player jump takeoff while the room field is active and keep normal jump behavior once that room field is disabled.
- `player-controller`: grounded jump initiation inside an active enclosed gravity room now becomes room-scoped inverse jump behavior while preserving normal controller rules outside that state.
- `stage-progression`: gravity-room validation and authored route expectations now need to keep active-field button access, reachability, and readability valid under inverse jump semantics.

## Impact

- Expected implementation areas: `src/game/simulation/GameSession.ts`, `src/game/simulation/state.ts`, `src/game/content/stages/catalog.ts`, and `src/game/content/stages/validation.ts`.
- Expected automated coverage: `src/game/simulation/GameSession.test.ts` and `src/game/content/stages.test.ts`.
- Expected authored verification: focused gravity-room playtests covering active inverse jump, disabled-room normal jump restoration, button-route readability, and unchanged enemy gravity behavior.