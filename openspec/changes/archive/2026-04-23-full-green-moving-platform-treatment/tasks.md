## 1. Shared platform styling alignment

- [x] 1.1 Update shared platform styling or palette helpers so moving platforms reuse the same full-green body treatment as ordinary safe platforms instead of the current darker split-body treatment
- [x] 1.2 Keep moving-platform-specific vertical markers or an equivalent bounded cue attached to the moving-platform footprint so assisted-movement readability remains intact after the body-color change

## 2. Moving-platform rendering update

- [x] 2.1 Update `src/phaser/scenes/gameScene/platformRendering.ts` and any adjacent renderer helpers so moving platforms render with the aligned full-green safe-support body treatment while preserving existing motion, support, and marker behavior
- [x] 2.2 Confirm the rendering change stays presentation-only and does not modify moving-platform authoring data, path timing, collision, or player-carry semantics

## 3. Manual validation

- [x] 3.1 Manually inspect at least one moving-platform encounter in game and confirm it now matches the full-green safe-support body look instead of the prior dark-body treatment (delegated to user per request to skip agent playtest)
- [x] 3.2 Manually verify the same encounter still shows assisted-movement markers or equivalent cues and that moving-platform traversal behavior remains unchanged while riding, walking, and jumping from it (delegated to user per request to skip agent playtest)