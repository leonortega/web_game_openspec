## Why

The current enclosed gravity-room rollout still treats the active gravity effect as a smaller authored field inside the room instead of the room's full interior play volume, which weakens the intended read of the room as one bounded gravity challenge. At the same time, current validation and runtime expectations lean toward keeping enemies out of gravity rooms entirely, even though the desired behavior is narrower: enemies may exist inside a room, but enemies that start inside must stay inside and enemies that start outside must never enter. This follow-up is needed now because the side-wall room flow and sealed-shell model already exist, and apply work should extend that model rather than reintroducing partial-field or shell-band-only loopholes.

## What Changes

- Define enclosed gravity rooms so their linked anti-grav or inversion effect uses the room's full interior play volume while active rather than a smaller interior sub-rectangle.
- Preserve the existing controller boundary that enclosed gravity rooms modify only the player and only ongoing airborne vertical acceleration; enemy gravity, grounded orientation, and other actor categories remain unchanged.
- Allow authored enemies inside enclosed gravity rooms when they are intentionally room-local content that remains contained to that room.
- Require enemy containment at room doors as well as sealed shell bands so enemies that start inside cannot leave through the doors and enemies that start outside cannot enter through them, regardless of whether the room field is currently active or disabled.
- Relax the current validation ban on enemies inside gravity rooms and replace it with validation and runtime requirements that accept contained interior enemies while still rejecting cross-boundary escape or intrusion.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: enclosed gravity rooms now apply their active gravity effect across the full room interior and may include contained interior enemies without allowing enemy transfer across room boundaries.
- `player-controller`: active enclosed gravity rooms now use the full room interior as the player's bounded airborne gravity-modifier volume while keeping all existing impulse-first and player-only rules.
- `stage-progression`: gravity-room validation and retry semantics now accept contained interior enemy encounters while rejecting door or shell boundary setups that let enemies move between room interior and exterior spaces.

## Impact

- Affected OpenSpec specs: `platform-variation`, `player-controller`, `stage-progression`.
- Expected implementation areas: `src/game/content/stages/types.ts`, `src/game/content/stages/catalog.ts`, `src/game/content/stages/builders.ts`, `src/game/content/stages/validation.ts`, `src/game/simulation/GameSession.ts`, and `src/phaser/scenes/gameScene/bootstrap.ts`.
- Expected test and verification areas: `src/game/content/stages.test.ts`, `src/game/simulation/GameSession.test.ts`, and focused gravity-room playtests that confirm full-room player gravity coverage plus enemy containment on both active and disabled room states.