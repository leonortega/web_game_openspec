## 1. Message Lane Positioning

- [x] 1.1 Re-anchor the transient gameplay-message lane closer to the bottom-left safe area while keeping it fully on-screen and clear of persistent HUD or readout overlaps on standard and narrow viewports
- [x] 1.2 Add or update layout coverage for simultaneous top-HUD, bottom-right readout, and bottom-left transient-message rendering

## 2. Defeat Particle Visibility

- [x] 2.1 Raise stomp and Plasma Blaster enemy-defeat particles above the ordinary gameplay object stack without changing defeat resolution timing
- [x] 2.2 Keep the player-death burst visibly distinct and clearly readable above ordinary gameplay objects while preserving the existing respawn cadence
- [x] 2.3 Tune bounded particle count, spread, contrast, or lifetime only as needed so stomp, Plasma Blaster, and player-death feedback remain readable in live play
- [x] 2.4 Add or update regression coverage for defeat-cause visibility and distinctness across stomp, Plasma Blaster, and player death

## 3. Verification

- [x] 3.1 Run the relevant automated tests for HUD layout and retro-presentation changes
- [x] 3.2 Verify in active play that transient messages sit closer to the bottom-left edge without overlapping persistent HUD or readouts on standard and narrow viewport sizes
- [x] 3.3 Verify in active play that stomp, Plasma Blaster, and player-death particles remain clearly visible during mixed encounters while preserving gameplay semantics and respawn timing