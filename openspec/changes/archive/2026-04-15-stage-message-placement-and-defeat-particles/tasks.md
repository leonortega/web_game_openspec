## 1. HUD Message Placement

- [x] 1.1 Move the transient gameplay and stage-message renderer from the top-center overlay into a lower-left safe-area lane while preserving the existing top scoreboard HUD band
- [x] 1.2 Make the lower-left message lane responsive for narrow or mobile-sized viewports so transient copy stays on-screen and readable without overlapping the primary HUD
- [x] 1.3 Update or add HUD layout coverage for simultaneous top-band status and lower-left transient message rendering

## 2. Defeat Cause Wiring

- [x] 2.1 Extend the simulation-to-presentation event flow so enemy defeats distinguish stomp kills from Plasma Blaster projectile kills without changing defeat timing
- [x] 2.2 Preserve the existing player-death handoff while marking it as a distinct player-only defeat presentation path
- [x] 2.3 Add or update event-flow coverage for stomp, Plasma Blaster projectile, and player-death defeat causes

## 3. Retro Presentation Variants

- [x] 3.1 Add a stomp-specific enemy defeat particle treatment that remains local and readability-safe in mixed encounters
- [x] 3.2 Add a distinct Plasma Blaster projectile enemy defeat particle treatment that remains local and readability-safe in mixed encounters
- [x] 3.3 Keep the player death burst visually distinct from both enemy-defeat variants while preserving the existing respawn cadence

## 4. Verification

- [x] 4.1 Run the relevant automated tests for HUD layout, simulation event flow, and retro presentation after implementation
- [x] 4.2 Verify in active play that stage-start or objective reminder messages render in the lower-left safe area on both standard and narrow viewport sizes
- [x] 4.3 Verify in active play that stomp kills, Plasma Blaster projectile kills, and player death each use the intended distinct bounded particle feedback