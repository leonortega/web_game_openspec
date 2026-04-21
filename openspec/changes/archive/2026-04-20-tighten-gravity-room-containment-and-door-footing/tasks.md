## 1. Validation Rules

- [x] 1.1 Extend gravity-room authoring validation in `src/game/content/stages/validation.ts` so sealed shell wall bands reject enemy, moving-platform, and other traversal-content intrusion outside authored door openings.
- [x] 1.2 Tighten gravity-room builder or catalog checks in `src/game/content/stages/builders.ts` and `src/game/content/stages/catalog.ts` so bottom entry and exit doors require explicit usable stable footing on their intended route segments.
- [x] 1.3 Add or update unit coverage in `src/game/content/stages.test.ts` for shell-band intrusion rejection and unsupported bottom door footing rejection.

## 2. Runtime Containment

- [x] 2.1 Update `src/game/simulation/GameSession.ts` so sealed gravity-room shell bands enforce containment for moving traversal content consistently with the authored contract.
- [x] 2.2 Add or update `src/game/simulation/GameSession.test.ts` coverage for blocked shell-band trespass and preserved traversal through authored door openings.

## 3. Stage Authoring And Verification

- [x] 3.1 Re-author any affected gravity-room stage data so external enemies or moving platforms no longer trespass sealed shell bands and both room doors have usable footing.
- [x] 3.2 Run relevant automated tests and any needed scripted playtests to confirm containment failures and unsupported door placements are caught by validation or runtime coverage.