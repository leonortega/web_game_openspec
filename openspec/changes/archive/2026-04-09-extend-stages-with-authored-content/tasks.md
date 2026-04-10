## 1. Reauthor stage content

- [x] 1.1 Remove the stage geometry scaling approach and restore authored object sizes to their normal scale.
- [x] 1.2 Extend each stage with additional authored platforms, enemies, blocks, checkpoints, and pacing segments so duration increases from real content.
- [x] 1.3 Update world bounds, exits, and playable routes so the longer stages still flow cleanly without stretched geometry.

## 2. Update interactive block feedback

- [x] 2.1 Ensure coin blocks continue to consume one hit per coin while revealing exactly one coin popup per punch.
- [x] 2.2 Keep power blocks single-use and verify their reveal feedback still fades after one second.
- [x] 2.3 Update playtest coverage for multi-hit coin blocks and the single-coin reveal behavior.

## 3. Simplify menu status presentation

- [x] 3.1 Remove the top-of-menu summary block that shows the selected option and run-state details.
- [x] 3.2 Add a tiny bottom-right status line for the selected option and active run settings.
- [x] 3.3 Verify keyboard and pointer navigation still update the footer correctly.

## 4. Validate the change

- [x] 4.1 Run build and stage playtests against the reauthored content.
- [x] 4.2 Validate the OpenSpec change and prepare it for archive.
