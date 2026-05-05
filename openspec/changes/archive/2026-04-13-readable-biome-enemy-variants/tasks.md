## 1. Variant Metadata And Runtime Support

- [x] 1.1 Extend authored enemy definitions and runtime enemy state with a bounded optional turret variant identifier limited to the supported biome-linked variants for this change.
- [x] 1.2 Add turret update logic in `src/game/simulation/GameSession.ts` for the `resinBurst` and `ionPulse` firing cadences while keeping deterministic telegraph timing and the existing stationary support role.
- [x] 1.3 Add the minimum rendering or presentation hooks needed so each turret variant shows a distinct readable biome telegraph that matches its actual firing timing.

## 2. Authored Stage Rollout

- [x] 2.1 Update Ember Rift Warrens turret placements in `src/game/content/stages.ts` so `resinBurst` first appears in an isolated teaching beat before one later mixed-encounter reuse.
- [x] 2.2 Update Halo Spire Array turret placements in `src/game/content/stages.ts` so `ionPulse` first appears in an isolated teaching beat before one later mixed-encounter reuse.
- [x] 2.3 Confirm each affected encounter still preserves safe staging points, lane separation, telegraph clarity, and authored predictability on the critical path.

## 3. Validation Coverage

- [x] 3.1 Add or update deterministic validation so authored biome-linked turret variants are restricted to the supported turret/stage combinations and keep their expected telegraph-to-fire timing.
- [x] 3.2 Update the existing playtest flow to exercise the affected Ember Rift and Halo Spire encounters and capture evidence that the solo teaching beats and later mixed encounters remain readable.

## 4. Final Verification

- [x] 4.1 Run the relevant project checks and the targeted stage playtest flow for the affected stages.
- [x] 4.2 Review the results to confirm the new turret variants do not regress encounter safety, support-based fairness, or mixed-encounter readability expectations.