## 1. Spec And Authoring Contract

- [x] 1.1 Update gravity-room OpenSpec deltas so enclosed gravity rooms apply their active anti-grav or inversion rule across the full room interior play volume rather than a smaller inner field rectangle.
- [x] 1.2 Update gravity-room OpenSpec deltas so authored enemies are allowed inside enclosed gravity rooms only when they remain room-local and cannot cross shell bands or side-wall doors into exterior space.
- [x] 1.3 Remove or relax any implementation-facing validation assumption that rejects gravity rooms solely because they contain interior enemies.

## 2. Runtime And Authoring Implementation

- [x] 2.1 Update `src/game/content/stages/types.ts`, `src/game/content/stages/catalog.ts`, and `src/game/content/stages/builders.ts` so enclosed gravity-room data and room construction use the full interior room volume for the player gravity effect while preserving side-wall door flow and retry semantics.
- [x] 2.2 Update `src/game/content/stages/validation.ts` so enclosed gravity rooms accept contained interior enemies, reject enemy transfer across shell bands or side-wall doors, and still reject layouts that only block shell bands while leaving doors enemy-passable.
- [x] 2.3 Update `src/game/simulation/GameSession.ts` and any supporting bootstrap wiring in `src/phaser/scenes/gameScene/bootstrap.ts` so active enclosed gravity rooms affect only the player across the full room interior while enemy containment holds for active and disabled room states.

## 3. Automated Coverage

- [x] 3.1 Add or update `src/game/content/stages.test.ts` coverage to accept enclosed gravity rooms with contained interior enemies and reject rooms where inside enemies can leave or outside enemies can enter.
- [x] 3.2 Add or update `src/game/simulation/GameSession.test.ts` coverage to prove that full-room gravity affects only the player, that enemy gravity remains unchanged, and that enemy containment holds at both sealed shell bands and side-wall doors.
- [x] 3.3 Run the narrow automated test slices for stage validation and game-session gravity-room behavior until they pass without regressing side-wall flow or retry semantics.

## 4. Focused Playtest Evidence

- [x] 4.1 Capture focused gravity-room playtest evidence showing the player experiences room-wide gravity behavior across the enclosed room interior rather than only inside a smaller sub-rectangle.
- [x] 4.2 Capture focused playtest evidence showing an interior enemy remains trapped inside an enclosed gravity room while an exterior enemy cannot enter through the same room's doors.
- [x] 4.3 Confirm through playtest evidence that disabling the room field changes only the player's gravity behavior and does not open enemy transfer across room boundaries.