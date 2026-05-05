## 1. Foundation

- [x] 1.1 Review the HUD, stage validation, player rendering, and shooter systems to confirm the integration points for this change.
- [x] 1.2 Add or update shared state/mapping for active power presentation and shooter visibility checks.

## 2. HUD Layout

- [x] 2.1 Rework the gameplay HUD so `Stage`, `Coins`, `Health`, and `Power` render in one clean horizontal top row.
- [x] 2.2 Move `Run` and `Segment` into tiny bottom-right text and remove the boxed lower HUD panel.
- [x] 2.3 Verify the HUD layout remains readable across the target gameplay resolutions.

## 3. Reward Block Safety

- [x] 3.1 Add authored-content validation that rejects reward blocks placed over stompable grounded enemies in the same lane.
- [x] 3.2 Update any affected stage placements so coins and powers no longer create progression locks.
- [x] 3.3 Add validation or test coverage for both a rejected blocked placement and a valid safe placement.

## 4. Player Power Variants

- [x] 4.1 Implement a distinct player appearance variant for each supported power: double jump, shooter, invincible, and dash.
- [x] 4.2 Ensure the player appearance updates immediately on power grant and resets on power clear or respawn.
- [x] 4.3 Verify the supported powers are visually distinct from one another in gameplay.

## 5. Shooter Visibility Gating

- [x] 5.1 Gate shooter firing on camera/viewbox visibility before bullets are spawned or sounds are played.
- [x] 5.2 Suppress bullet visuals and bullet audio while the shooter is off-screen, then resume normal behavior once visible.
- [x] 5.3 Verify the start-of-stage behavior no longer shows bullets or plays bullet sounds before the shooter enters view.

## 6. Verification

- [x] 6.1 Run the relevant playtests or automated checks for HUD, block safety, power visuals, and shooter visibility.
- [x] 6.2 Confirm the new specs, design, and tasks are internally consistent and ready for `/opsx:apply`.
