## 1. Astronaut Avatar Refresh

- [x] 1.1 Refactor the player visual composition into an original more human-like retro astronaut silhouette for the base suit and supported power variants while preserving hitbox semantics and existing power readability
- [x] 1.2 Update the player's bounded idle, movement, airborne, and defeat presentation states so the refreshed astronaut remains readable at gameplay scale without changing controller or power behavior

## 2. Respawn Visual-State Recovery

- [x] 2.1 Add a single full-state player visual reset path that clears defeat tweens, detached-part offsets, tint, alpha, scale, rotation, and visibility overrides before respawn returns the player to active play
- [x] 2.2 Verify the refreshed astronaut composition remains compatible with the existing defeat readability flow and no broken body-part state persists after checkpoint or stage-start respawns

## 3. Planetary Backdrop Refresh

- [x] 3.1 Extend the shared backdrop helper and any needed stage palette inputs to render original extraterrestrial spacescape motifs derived from authored palette roles rather than copied reference imagery
- [x] 3.2 Tune backdrop colors, contrast, and motif density so platforms, hazards, pickups, player powers, HUD text, and transition overlays remain more readable than the background across representative stages

## 4. Coverage And Validation

- [x] 4.1 Update presentation or scene-level tests for player visual reset behavior, refreshed astronaut composition routing, and backdrop palette constraints where automated coverage already exists
- [x] 4.2 Validate in active play that the astronaut refresh, defeat-to-respawn reset, and extraterrestrial backdrops all read clearly without gameplay regressions or foreground/background color clashes