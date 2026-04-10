## 1. HUD Stage Label Copy

- [x] 1.1 Update the gameplay HUD stage label to render only the authored stage name on the player-visible title surface
- [x] 1.2 Remove or narrow any now-unused HUD model plumbing for stage-duration suffix data only where it is no longer consumed

## 2. Powered-Hit Invincibility Retention

- [x] 2.1 Refactor the GameSession powered-hit flow so damaging contact preserves invincibility while its timer is active
- [x] 2.2 Keep the existing non-invincible powered-hit behavior by clearing other active powers without removing health, including mixed-power cases where invincibility is also active
- [x] 2.3 Update any player-facing hit or power rules text that would otherwise incorrectly state that every powered hit clears all powers

## 3. Regression Coverage and Validation

- [x] 3.1 Update GameSession regression tests to cover non-invincible powered hits, invincibility retention, and mixed-power hits
- [x] 3.2 Run the repo validation commands and confirm the HUD and powered-hit behavior remain correct