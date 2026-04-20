## 1. Enemy Visual Refresh

- [x] 1.1 Update the supported enemy presentation branches in `retroPresentation` and any required boot-generated textures so enemy silhouettes refresh in an original retro style while preserving existing gameplay bounds and readability
- [x] 1.2 Rework the flying-enemy accent placement and lower-hull presentation so hover enemies read as underside-lit saucers or ovnis without changing movement, collision, or encounter timing

## 2. Defeat And Death Audio Identity

- [x] 2.1 Retune the synthesized enemy-defeat and player-death cues in the current audio path so stomp, projectile defeat, survivable damage, and fatal death remain audibly distinct and stronger in identity
- [x] 2.2 Wire the updated cue selection through the existing gameplay event boundaries in scene or simulation routing without changing defeat resolution, checkpoint behavior, or respawn cadence

## 3. Regression Coverage And Validation

- [x] 3.1 Update related presentation, simulation, and audio tests for refreshed enemy rendering expectations and differentiated defeat or death cue routing
- [x] 3.2 Verify in play that the enemy visual refresh and stronger defeat audio preserve the recent defeat-readability presentation, keep gameplay semantics unchanged, and do not introduce encounter-authoring regressions