## 1. Stage Reauthoring

- [x] 1.1 Double each stage's authored length by expanding world width and re-spacing segments, checkpoints, collectibles, reward blocks, enemy lanes, and exits.
- [x] 1.2 Update stage data and runtime assumptions so punchable blocks have enough vertical clearance above the floor to be reached from below.

## 2. Block Interaction Logic

- [x] 2.1 Change reward blocks to track remaining hits so coin blocks can require multiple punches and release one coin per hit.
- [x] 2.2 Keep power blocks single-hit while preserving the existing fixed power set and authored placement rules.
- [x] 2.3 Update underside collision handling so a punch from below consumes one block hit and advances the reward state deterministically.

## 3. Reward Reveal Feedback

- [x] 3.1 Spawn a transient visual reveal for each punched coin or power and fade it out after 1 second.
- [x] 3.2 Render block-hit feedback so repeated punches on multi-coin blocks remain readable without obscuring nearby gameplay.

## 4. Verification

- [x] 4.1 Update or add playtest coverage for the longer stages and punchable block spacing.
- [x] 4.2 Run build and playtest checks to confirm the longer routes, multi-hit coin blocks, and reveal fades behave correctly.
