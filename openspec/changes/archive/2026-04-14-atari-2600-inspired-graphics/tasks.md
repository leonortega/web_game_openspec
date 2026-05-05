## 1. Shared Visual Direction

- [x] 1.1 Define the bounded Atari 2600-inspired palette, silhouette rules, and flat-fill treatment used across gameplay scenes without changing mechanics or scene flow
- [x] 1.2 Update procedural or generated presentation assets in the gameplay scenes so terrain, props, pickups, and other placeholder surfaces follow the new coarse, limited-color style
- [x] 1.3 Keep any optional screen-space analog treatment out of the required implementation baseline, or gate it behind a single subtle, non-blocking hook if implementation adds it

## 2. Gameplay Readability Pass

- [x] 2.1 Update player base and power-specific visuals so each supported power remains readable through silhouette or accent differences within the reduced palette
- [x] 2.2 Update enemy and hazard presentation so idle, dangerous, and telegraph states remain distinguishable without relying on gradients or fine texture detail
- [x] 2.3 Verify that checkpoints, reward blocks, collectibles, and other routing-critical interactables remain readable against the flatter stage backgrounds

## 3. HUD And Transition Presentation

- [x] 3.1 Restyle the gameplay HUD into a scoreboard-like top band with limited colors, flat fills, and high-contrast text while preserving the current information contract
- [x] 3.2 Restyle the stage intro scene to the same retro presentation language while preserving stage identity and player-status readability
- [x] 3.3 Restyle the completion scene to the same retro presentation language while preserving progression totals, power labels, and current flow timing

## 4. Verification

- [x] 4.1 Add or update visual/playtest coverage for gameplay readability, including power variants, enemy telegraphs, and hazard contrast against stage backgrounds
- [x] 4.2 Add or update coverage for the scoreboard-style HUD and the retro-styled stage intro and completion surfaces
- [x] 4.3 Run build and relevant playtest validation and record any readability adjustments needed before closing the change