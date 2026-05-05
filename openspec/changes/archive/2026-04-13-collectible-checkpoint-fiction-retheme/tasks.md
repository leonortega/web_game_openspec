## 1. Shared Fiction Mapping

- [x] 1.1 Audit the current collectible and checkpoint strings across gameplay HUD, stage messages, and transition scenes to identify every player-facing surface that still uses inconsistent naming
- [x] 1.2 Add shared presentation labels for `research sample(s)` and `survey beacon(s)` without renaming internal coin or checkpoint mechanics

## 2. Gameplay Surface Updates

- [x] 2.1 Update active-play HUD collectible labels and in-stage messaging to use the new research-sample and survey-beacon terminology consistently
- [x] 2.2 Keep stage-local and run-total collectible displays in the same noun family across gameplay-facing surfaces
- [x] 2.3 Preserve checkpoint activation, respawn placement, collectible counts, reward-block payouts, and full-clear energy restore behavior while the copy changes land

## 3. Transition Surface Updates

- [x] 3.1 Update the stage intro and stage-clear screens to use the same collectible and checkpoint fiction as active gameplay
- [x] 3.2 Ensure transition totals and status labels do not reintroduce old collectible or checkpoint nouns on intro or results screens

## 4. Verification

- [x] 4.1 Add or update automated or playtest coverage for collectible and checkpoint naming consistency across HUD, stage messages, and transition screens
- [x] 4.2 Verify that progression logic remains unchanged for collectible totals, checkpoint activation and persistence, reward-block payouts, and the full-clear energy restore rule
- [x] 4.3 Run the relevant validation commands and confirm the change is ready for `/opsx:apply`