## 1. Controller And Room-State Behavior

- [x] 1.1 Update `src/game/simulation/GameSession.ts` and related room-state helpers so supported player jump initiation inside an active enclosed gravity room uses the inverse takeoff, while buffered and coyote jumps sourced from that room support follow the same rule.
- [x] 1.2 Preserve current behavior for double jump, springs, bounce pods, gas vents, dash, enemy gravity, and non-room gravity fields so the inverse takeoff stays limited to player jump initiation inside active enclosed gravity rooms.
- [x] 1.3 Ensure disabling a room immediately restores normal jump semantics inside that room and that leaving the room also restores the surrounding normal controller rule.

## 2. Stage Authoring And Validation

- [x] 2.1 Update `src/game/content/stages/catalog.ts` and any supporting stage data so each active gravity-room button route remains readable and reachable under inverse jump semantics without adding validator-only helper supports.
- [x] 2.2 Update `src/game/content/stages/validation.ts` so enclosed gravity rooms are accepted only when active-field button access, side-wall flow, and contained-enemy placement remain valid under inverse jump semantics.
- [x] 2.3 Update any related state or content definitions in `src/game/simulation/state.ts` and stage validation fixtures so active versus disabled room behavior remains explicit and testable.

## 3. Automated Coverage And Focused Evidence

- [x] 3.1 Add or update `src/game/simulation/GameSession.test.ts` coverage for active-room inverse jump, buffered and coyote jump behavior inside active rooms, disabled-room normal jump restoration, and unchanged enemy gravity behavior.
- [x] 3.2 Add or update `src/game/content/stages.test.ts` coverage for gravity-room authoring and validation rules that keep button routes readable and reachable under inverse jump semantics.
- [x] 3.3 Run the narrow automated test slices for game-session and stage-validation gravity-room behavior, then capture focused gravity-room playtest evidence showing active inverse jump plus normal jump restoration after the room field is disabled.