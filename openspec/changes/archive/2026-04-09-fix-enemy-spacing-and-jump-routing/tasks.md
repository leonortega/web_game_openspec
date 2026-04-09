## 1. Stage Data Cleanup

- [x] 1.1 Inspect the current authored stages for turret and hazard overlaps, then move conflicting shooting enemies to safer nearby supported positions.
- [x] 1.2 Confirm the updated placements still preserve each stage's intended encounter pacing and supported lanes.

## 2. Runtime Enemy Spacing

- [x] 2.1 Add a deterministic spacing/placement helper in the simulation layer so shooting enemies are repositioned away from nearby hazards and grounded enemies during snapshot creation.
- [x] 2.2 Ensure the helper preserves supported terrain constraints and does not create unsupported enemy placement.

## 3. Hopper Routing

- [x] 3.1 Add hopper target-platform selection so hopping enemies choose a reachable supported landing platform before jumping.
- [x] 3.2 Compute hop impulse and horizontal movement from the selected landing gap so the hopper lands instead of falling into open space.
- [x] 3.3 Add a fallback behavior for cases where no valid landing platform exists, keeping the hopper on support until a safe target appears.

## 4. Verification

- [x] 4.1 Validate the updated enemy placement and hopper behavior in the affected stages.
- [x] 4.2 Run the project checks or stage playtest flow and confirm the change is ready to apply.
