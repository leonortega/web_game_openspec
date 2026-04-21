## 1. Room-By-Room Authoring Plan

- [x] 1.1 Audit `forest-anti-grav-canopy-room`, `amber-inversion-smelter-room`, `sky-anti-grav-capsule`, and `sky-gravity-inversion-capsule` against the proposal contract, confirming for each room what geometry is kept, what doorway positions move, and what yellow-marked arrangements are removed or demoted.
- [x] 1.2 Lock side-aware room semantics in implementation notes and tests so `IN` means left-side room entry and `OUT` means right-side room exit for all four current gravity rooms.

## 2. Validation And Authoring Rules

- [x] 2.1 Update gravity-room validation and any supporting authoring helpers so current rooms fail when entry or exit still reads from the wrong side, when a yellow-marked arrangement remains the doorway solution, or when a fake low bottom-door workaround is used.
- [x] 2.2 Add or update focused automated coverage to reject helper ledges, doorway-only compliance platforms, and technically passable but experientially wrong IN/OUT flow for the four current rooms.

## 3. Room Re-Authoring

- [x] 3.1 Re-author `forest-anti-grav-canopy-room` and `amber-inversion-smelter-room` so each keeps the enclosed-room model, gravity field, interior disable button, and reset behavior while moving `IN` to the left-side approach and `OUT` to the right-side reconnect.
- [x] 3.2 Re-author `sky-anti-grav-capsule` and `sky-gravity-inversion-capsule` with the same left-entry and right-exit contract, removing or demoting wrong yellow-marked doorway solutions without adding helper ledges or doorway-only compliance platforms.
- [x] 3.3 Confirm any geometry that remains but no longer counts as doorway flow is treated only as incidental room geometry rather than as entry or exit support.

## 4. Focused Verification

- [x] 4.1 Run targeted gravity-room validation and unit coverage proving the four named rooms reject wrong-side or workaround doorway flow and accept only the intended left-entry/right-exit solutions.
- [x] 4.2 Run focused playtests for forest, amber, sky anti-grav, and sky inversion rooms to confirm player-facing IN/OUT flow is correct and that the change does not regress enclosed-room behavior, button access, or reset behavior.