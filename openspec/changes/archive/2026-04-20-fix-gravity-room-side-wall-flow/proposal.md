## Why

The current enclosed gravity-room contract still assumes bottom-edge door openings in core specs, validation language, and runtime containment helpers. That leaves the repo vulnerable to false-positive passes where a room reads left-to-right on paper but still keeps bottom doors, bottom helper strips, or bottom-edge pass-through that breaks the intended side-wall flow.

## What Changes

- Replace the current enclosed gravity-room doorway contract from bottom-edge openings to side-wall openings, while preserving the enclosed shell, one linked gravity field, one interior disable button, and reset behavior.
- Require the current four playable gravity rooms to use left-wall `IN` entry and right-wall `OUT` exit, with no bottom doors remaining anywhere in those rooms.
- Remove or demote later-added bottom helper platforms, helper ledges, and bottom route strips that existed only to support bottom doors, and require doorway support to reuse existing side-adjacent intended route supports instead.
- Tighten validation and runtime shell-wall behavior so bottom-edge door remnants, above-room surrogate supports, and other technically passable but player-facing wrong doorway arrangements are rejected rather than treated as acceptable flow.
- Update room authoring, automated tests, runtime containment coverage, and focused gravity-room playtests so the side-wall contract is enforced end to end.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `platform-variation`: enclosed gravity rooms now require side-wall entry and exit openings, sealed bottom edges, reused side-adjacent support geometry, and rollout-wide removal of bottom-door helper solutions.
- `stage-progression`: gravity-room validation now rejects bottom-edge doorway false positives and requires current rooms to preserve side-wall `IN` and `OUT` flow under retry and reset semantics.
- `retro-presentation-style`: gravity-room presentation now needs to read through side-wall openings rather than bottom cutouts while staying distinct from the stage exit.

## Impact

- Affected OpenSpec specs: `platform-variation`, `stage-progression`, `retro-presentation-style`.
- Expected implementation areas: `src/game/content/stages/catalog.ts`, `src/game/content/stages/builders.ts`, `src/game/content/stages/types.ts`, `src/game/content/stages/validation.ts`, and any gravity-room rendering helpers that still assume bottom openings.
- Expected runtime and test areas: `src/game/simulation/GameSession.ts`, `src/game/content/stages.test.ts`, `src/game/simulation/GameSession.test.ts`, and focused gravity-room view coverage if shell-door rendering is edge-specific.
- Expected focused verification: `scripts/gravity-room-in-out-flow-playtest.mjs` plus any narrowly related gravity-room playtest pass needed to confirm all current rooms remain traversable after bottom-door removal.