## Why

Current stages still rely on authored spring platforms even though bounce pods already cover the intended launcher family for this route language. Keeping springs alive in authored data, runtime branches, validation, tests, and specs preserves a duplicate assisted-movement concept, weakens category readability, and blocks clean removal of spring-only presentation and audio rules.

## What Changes

- **BREAKING** Remove spring as supported authored traversal type and runtime category from stage data, validation, simulation, rendering, audio hooks, and regression fixtures.
- Replace each authored spring route in the stage catalog with bounce-pod launcher authoring plus whatever plain support footing is needed to preserve route shape, contact timing, and assisted-movement readability.
- Update controller and launcher contracts so bounce pods remain the only green contact-launch surface in this family and inherit any remaining spring-only wording that still matters for jump-hold suppression, sticky-sludge composition, and gravity-field composition.
- Remove spring-specific spec language, scripted coverage, and test expectations so launcher coverage and stage validation target bounce pods and gas vents only.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `platform-variation`: remove spring platforms from supported traversal variants and require former spring routes to read as bounce-pod-assisted support geometry instead of presentation-only swaps.
- `player-controller`: remove spring-launch wording from movement-composition rules and express remaining impulse-ordering rules in terms of bounce pods, gas vents, jumps, and dash behavior only.
- `stage-progression`: reject lingering spring authoring, require bounce-pod support alignment for converted routes, and move regression coverage to launcher-only fixtures and playtests.
- `audio-feedback`: remove spring activation references so movement-state and traversal-cue audio rules cover bounce pods and gas vents without dead spring branches.

## Impact

- Affects authored stage content in `src/game/content/stages/catalog.ts`, including the four current spring placements called out in explore.
- Affects stage content types, builders, validation, runtime session state, renderer branches, and audio cue selection anywhere spring remains part of unions or mechanic dispatch.
- Affects tests and scripted playtests that currently assert spring behavior or use spring fixtures.
- Affects OpenSpec contracts in `openspec/specs/platform-variation/spec.md`, `openspec/specs/player-controller/spec.md`, `openspec/specs/stage-progression/spec.md`, and `openspec/specs/audio-feedback/spec.md`.