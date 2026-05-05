## 1. Stage Authoring And Validation

- [x] 1.1 Extend gravity-room stage authoring in `src/game/content/stages.ts` to represent enclosed room shells, separate bottom entry and exit openings, one linked interior disable button, and contained room content linkage
- [x] 1.2 Add or update authored validation so every enclosed gravity room starts from an active-field baseline, keeps all linked room content inside shell bounds, and rejects cut-off or unreachable room routing
- [x] 1.3 Add or update authored-data tests for valid and invalid enclosed gravity rooms, including unreachable disable buttons, shared-door misuse, out-of-bounds room content, and cut-off interior routes

## 2. Runtime Gravity-Room State And Controller Gating

- [x] 2.1 Extend runtime session state to track enclosed gravity rooms as active on reset and disabled after interior button contact
- [x] 2.2 Update session logic so first eligible button contact disables the linked room field on the same update and reset flows restore the room to active state
- [x] 2.3 Update controller-facing gravity handling so active rooms affect only airborne vertical acceleration and disabled rooms restore normal gravity without changing jump, launcher, dash, or grounded rules
- [x] 2.4 Add or update runtime tests for active-room entry, disable timing, disabled-room traversal, dash composition, and retry reset behavior

## 3. Scene Presentation, Authored Content, And Coverage

- [x] 3.1 Update gravity-room scene presentation so active versus disabled state, separate bottom entry and exit openings, and interior disable buttons stay readable and distinct from stage exits
- [x] 3.2 Author or revise at least one enclosed gravity room section so all platforms, enemies, hazards, pickups, and route geometry remain fully contained and reachable inside the room shell
- [x] 3.3 Update scripted playtest or traversal coverage to exercise room entry, disable-button reachability, disabled exit traversal, and containment expectations
- [x] 3.4 Run relevant automated tests and playtest validation for enclosed gravity rooms and record results in change follow-through notes