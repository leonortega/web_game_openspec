## 1. Stage Authoring and Validation

- [x] 1.1 Extend stage content types and validation for rectangular gravity-field records with supported `anti-grav-stream` and `gravity-inversion-column` kinds
- [x] 1.2 Add the bounded Halo Spire Array sky-section rollout using the two field variants without broadening authored use to additional stages
- [x] 1.3 Add validation coverage for zero-area or overlapping gravity fields and checkpoint placement safety near gravity-field routes

## 2. Controller and Runtime Behavior

- [x] 2.1 Update simulation and controller resolution so gravity fields affect only the player's airborne vertical acceleration after jump, double jump, launcher, spring, and sludge-modified jump impulses
- [x] 2.2 Preserve dash as the active override that suppresses low-gravity, anti-grav-stream, and gravity-inversion acceleration while dash motion is in control
- [x] 2.3 Ensure gravity fields remain stateless across fresh attempts, restarts, and checkpoint respawns and restore normal gravity immediately on field exit
- [x] 2.4 Update scene presentation and collision setup so the new field sections are readable in the Halo Spire Array sky route without implying ceiling walking or generalized directional physics

## 3. Verification

- [x] 3.1 Add unit coverage for controller ordering across low gravity, anti-grav streams, gravity inversion columns, dash, sludge, launchers, springs, and falling-platform escape timing
- [x] 3.2 Add state or authored-validation coverage for gravity-field reset behavior, overlap rejection, and respawn-safe checkpoint placement
- [x] 3.3 Update scripted stage playtest coverage for the Halo Spire Array sky route to confirm the bounded rollout remains readable, completable, and reset-consistent
- [x] 3.4 Run the relevant automated tests and playtest validation and record the results