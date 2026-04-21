## 1. Gravity-Room Contract And Validation

- [x] 1.1 Update gravity-room authoring types and helper logic in `src/game/content/stages/types.ts` and `src/game/content/stages/builders.ts` so enclosed rooms author side-wall entry and exit openings, keep the full bottom edge sealed, and derive doorway support from existing side-adjacent route geometry rather than bottom helper strips.
- [x] 1.2 Tighten `src/game/content/stages/validation.ts` to reject any current gravity room that still uses a bottom-edge door, bottom helper platform, bottom route strip, above-room surrogate support, or other false-positive flow that passes only by left-right heuristics.
- [x] 1.3 Add or update focused authoring coverage in `src/game/content/stages.test.ts` for valid side-wall reuse of fixed or moving supports, explicit rejection of bottom-edge doorway remnants, and the forest moving-platform support case at `8610,450`.

## 2. Runtime Shell And Presentation Behavior

- [x] 2.1 Update `src/game/simulation/GameSession.ts` and any dependent gravity-room helper functions so shell collision and pass-through use side-wall door cutouts instead of bottom-span openings, while preserving containment for players, moving platforms, and enemies everywhere else.
- [x] 2.2 Add or update `src/game/simulation/GameSession.test.ts` coverage for sealed bottom-edge behavior, side-wall pass-through, and traversal-content containment at the new door positions.
- [x] 2.3 Update gravity-room rendering helpers only if needed, including `src/phaser/scenes/GameScene.ts` or related view tests, so visible shell openings and door markers match side-wall authored openings rather than floor cutouts.

## 3. Current Room Re-Authoring And Verification

- [x] 3.1 Re-author `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` in `src/game/content/stages/catalog.ts` to remove bottom doors and doorway-only bottom supports, relocate entry and exit flow onto existing side-adjacent supports, and preserve each room's shell, linked field, interior disable button, and reset behavior.
- [x] 3.2 Keep the forest room's pre-room moving platform at `8610,450` as an allowed doorway-support example if it still serves the intended route, and update any dependent route rectangles or support metadata so entry, button path, and exit reconnect remain readable.
- [x] 3.3 Run focused automated tests plus `scripts/gravity-room-in-out-flow-playtest.mjs` to confirm all current gravity rooms reject bottom-door false positives and remain traversable under the side-wall-only contract.