## 1. Stage Authoring Conversion

- [x] 1.1 Replace the four authored spring beats in `src/game/content/stages/catalog.ts` with bounce-pod launcher authoring plus the minimum plain-support geometry needed to preserve footing, route shape, and readable assisted movement.
- [x] 1.2 Update stage-building and authored-data validation so spring is no longer accepted anywhere, converted launcher footprints stay aligned to valid support, and lingering spring authoring is rejected before runtime.

## 2. Runtime And Presentation Removal

- [x] 2.1 Remove spring from traversal types, builders, runtime state, simulation dispatch, and controller composition branches while preserving bounce-pod and gas-vent launch timing, suppression, sticky-sludge composition, gravity-field composition, and dash behavior.
- [x] 2.2 Remove spring-specific rendering and audio cue branches so bounce pods remain the only green contact-launch surface in this family and no dead spring presentation logic remains.

## 3. Regression And Scripted Coverage

- [x] 3.1 Retarget automated tests and fixtures from spring coverage to bounce-pod or gas-vent coverage, including launcher validation, converted route expectations, and rejection of legacy spring authoring.
- [x] 3.2 Update scripted playtests and analysis for the converted stage beats, then run the focused validation, tests, and scripted coverage needed to prove the spring-to-bounce-pod migration still preserves intended routes.