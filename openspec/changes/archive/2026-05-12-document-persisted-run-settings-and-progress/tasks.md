## 1. Persistence Contract Audit

- [x] 1.1 Verify the saved run-level payload fields and invalid-payload fallback behavior against `RunProgressStore`, `SceneBridge`, and `BootScene`.
- [x] 1.2 Verify that boot hydration restores run-level progress only and does not resume checkpoint-local or route-local stage attempt state.

## 2. Spec Alignment

- [x] 2.1 Add the `run-progress-persistence` capability covering boot hydration, persisted run settings, and fail-closed default behavior.
- [x] 2.2 Update the `main-menu` capability so the options contract matches the shipped difficulty, enemy pressure, music volume, SFX volume, and CRT controls.

## 3. Consistency Review

- [x] 3.1 Cross-check the new and modified specs against the current runtime code paths in `GameSession`, `MenuScene`, `BootScene`, and `retroPostFx`.
- [x] 3.2 Review the finished change for archive readiness once the team agrees the documented behavior is the intended baseline.
