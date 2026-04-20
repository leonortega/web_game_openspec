## 1. Authored Data and Validation

- [x] 1.1 Replace brittle and sticky `terrainSurfaces` authoring with full-platform variant metadata on supported static platforms.
- [x] 1.2 Update stage validation to reject legacy brittle or sticky overlay records, reject invalid static-platform variant usage, and catch contradictory mixed authoring.
- [x] 1.3 Migrate existing stage catalog data, builders, and fixtures so brittle and sticky content uses platform variants only.

## 2. Runtime and Rendering

- [x] 2.1 Remove runtime ingestion paths that depend on separate brittle or sticky overlay rectangles and ingest platform variants from shared stage data instead.
- [x] 2.2 Implement brittle full-platform runtime state in `src/game/simulation/state.ts` and `src/game/simulation/GameSession.ts`, including warning, delayed break, fair support at expiry, and reset behavior tied to platform identity.
- [x] 2.3 Update sticky runtime/controller behavior so sticky changes grounded acceleration and grounded top speed only and no longer modifies grounded jump, buffered jump, or coyote-jump launch rules.
- [x] 2.4 Update Phaser bootstrap and platform rendering so brittle and sticky cues cover the entire authored platform footprint and stay synchronized with runtime state.

## 3. Tests and Playtests

- [x] 3.1 Update or add validation and runtime tests for platform-variant authoring, brittle state transitions, legacy overlay rejection, and sticky no-longer-modifies-jump behavior.
- [x] 3.2 Update scripted playtest coverage and any stage-analysis scripts that currently inspect `terrainSurfaces` so they validate migrated brittle and sticky platform variants.
- [x] 3.3 Run relevant automated tests and playtest scripts and record results for the migrated platform-variant model.