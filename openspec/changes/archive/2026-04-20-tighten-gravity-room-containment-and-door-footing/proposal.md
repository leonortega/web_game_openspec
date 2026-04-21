## Why

Current enclosed gravity rooms still allow authored or runtime content to visually or physically trespass sealed shell bands, and some bottom door openings sit on route segments without clear usable footing. This follow-up is needed now because the base enclosed-room rollout already exists, but containment and door usability remain under-specified in ways that produce broken room reads and inaccessible route beats.

## What Changes

- Tighten enclosed gravity room requirements so shell space outside the authored bottom entry and exit door openings behaves as a sealed containment band for room-local and room-external traversal content, not only for the player.
- Require enclosed gravity rooms to keep outside moving platforms, enemies, hazards, and other traversable support from crossing sealed shell wall bands except through authored door openings.
- Require both bottom entry and bottom exit door openings to connect to explicit usable platform footing on their intended reachable route segments so door traversal does not depend on floating or inaccessible placement.
- Extend authored validation, runtime coverage, and tests so gravity-room content containment and entry/exit door footing failures are rejected before or during verification.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: enclosed gravity room containment now covers moving platforms, enemies, and other authored traversal content at sealed shell bands, and bottom door openings must connect to usable local footing.
- `stage-progression`: authored route validation for enclosed gravity room entry and exit doors now requires reachable bottom-route placement with explicit platform footing rather than merely lying on a nominal route segment.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`.
- Expected implementation areas: gravity-room authoring and validation in `src/game/content/stages/catalog.ts`, `src/game/content/stages/validation.ts`, and `src/game/content/stages/builders.ts`.
- Expected runtime and test areas: gravity-room containment behavior in `src/game/simulation/GameSession.ts`, coverage in `src/game/content/stages.test.ts` and `src/game/simulation/GameSession.test.ts`, and scripted playtests if containment or door-footing assertions need end-to-end verification.