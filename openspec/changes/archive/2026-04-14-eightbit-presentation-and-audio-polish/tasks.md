## 1. Gameplay Presentation Refresh

- [x] 1.1 Update the shared gameplay-facing rendering and palette helpers so player, enemy, terrain, and backdrop visuals can gain denser 8-bit pixel detail without changing gameplay timing or authored stage data.
- [x] 1.2 Rework the player base and power-specific presentation mappings so each supported power keeps a readable astronaut silhouette plus distinct 8-bit accent detail at gameplay scale.
- [x] 1.3 Rework enemy, hazard, projectile, terrain, and backdrop rendering so the denser 8-bit pass preserves telegraph readability and foreground versus background separation.

## 2. Menu Music And Threat Audibility

- [x] 2.1 Fix main-menu sustained music startup and ownership so the designated title track becomes audibly active as soon as browser audio unlocks while the menu owns music.
- [x] 2.2 Preserve clean sustained-music handoffs between menu, transition, and gameplay scenes so the menu fix does not break existing track ownership or Phaser 4 runtime-compatibility expectations.
- [x] 2.3 Add viewport-aware enemy motion or presence cue triggering so visible threats become audible at the right time, while off-screen enemies remain quiet except for the supported turret lead-margin telegraph case.

## 3. Regression And Playtest Validation

- [x] 3.1 Add or update automated coverage for menu audio unlock behavior, sustained-music ownership, and viewport-gated enemy audibility.
- [x] 3.2 Add or update focused validation for denser 8-bit readability across player, enemies, terrain, and stage backdrops, including foreground versus background separation.
- [x] 3.3 Run the relevant build, tests, and playtest flow to confirm the polish pass does not regress scene flow, gameplay timing, turret fairness, or audio stability.