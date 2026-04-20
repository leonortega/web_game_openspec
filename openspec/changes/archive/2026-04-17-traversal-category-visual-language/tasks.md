## 1. Traversal Visual Foundations

- [x] 1.1 Refactor the traversal rendering branches in `src/phaser/scenes/GameScene.ts` so assisted movement, route toggles, and gravity modifiers can share category-level overlays without collapsing mechanic-specific cues.
- [x] 1.2 Add bounded primitive-based overlays, accents, or state markers for the three traversal categories using the existing scene rendering path rather than a new texture or shader pipeline.
- [x] 1.3 Ensure traversal visuals reset correctly across fresh stage loads, deaths, checkpoint respawns, restarts, and mechanic state changes.

## 2. Mechanic Category Treatments

- [x] 2.1 Apply the assisted-movement family treatment to springs, bounce pods, gas vents, moving or lift platforms, and unstable support surfaces while preserving readable differences between carry, launch, and failing support behavior.
- [x] 2.2 Apply the route-toggle family treatment to reveal platforms, scanner-triggered temporary bridges, timed-reveal supports, activation nodes, magnetic platforms, and gravity capsule buttons or shell cues with clear dormant-versus-active feedback.
- [x] 2.3 Apply the gravity-modifier family treatment to anti-grav streams, gravity inversion columns, and enabled gravity-capsule field interiors so they read as airborne acceleration spaces rather than launchers or solid support.

## 3. Validation

- [x] 3.1 Extend renderer, scene, or authored-data tests to assert that traversal mechanics map to the intended visual-language categories and preserve their local state transitions.
- [x] 3.2 Add or update targeted scripted verification so at least one assisted-movement route, one route-toggle route, and one gravity-modifier route are exercised during regression checks.
- [x] 3.3 Run the relevant automated tests and scripted playtests, then record that the traversal category visual language passes verification before handoff to apply completion.