## 1. Hazard Model Cleanup

- [x] 1.1 Remove `pit` from the hazard kind model, runtime handling, and hazard rendering.
- [x] 1.2 Replace all authored `lava` hazards with `spikes` in stage data and confirm they render correctly.

## 2. Encounter Spacing

- [x] 2.1 Move spikes or turrets in affected stages so they do not share the same support platform area.
- [x] 2.2 Preserve readable support margins for turret placements after the spike updates.

## 3. Verification

- [x] 3.1 Run the build and stage playtest flow to confirm the hazard cleanup behaves correctly.
- [x] 3.2 Verify that no `pit` or `lava` hazards remain in the active stage content.
