## 1. Stage Authoring And Validation

- [x] 1.1 Remove the Halo Spire Array checkpoint that is currently authored after the exit door and update any affected stage-data expectations
- [x] 1.2 Add at least one terrain-surface section and one bounded gravity-field section to Verdant Impact Crater and Ember Rift Warrens, with each stage using a distinct route role that matches the updated platform-variation contract
- [x] 1.3 Update stage validation, stage content tests, and scripted playtest coverage so the three main stages require terrain and gravity rollout and reject checkpoints authored beyond the terminal exit

## 2. Enemy Motion And Defeat Feedback

- [x] 2.1 Extend the state-driven enemy presentation path so grounded walkers and hoppers expose readable movement states while ovni or flyer enemies use separate sparkle-light hover accents
- [x] 2.2 Add short local enemy defeat dissolve or disappearing-particle feedback without changing defeat resolution timing, encounter fairness, or active threat readability
- [x] 2.3 Add or update enemy presentation and simulation coverage for grounded motion states, flyer sparkle feedback, and mixed-encounter defeat readability

## 3. Player Defeat Presentation

- [x] 3.1 Add a short bounded player blow-apart defeat effect on the existing retro presentation path and hand it off cleanly into the current respawn flow
- [x] 3.2 Ensure GameSession, GameScene, and retro presentation hooks expose the new defeat event timing without changing damage rules, checkpoint selection, or power-clearing behavior
- [x] 3.3 Add or update coverage for player death feedback timing, checkpoint respawn continuity, and power clearing after defeat

## 4. Verification

- [x] 4.1 Run the relevant automated tests for stage content, simulation, and retro presentation after implementation
- [x] 4.2 Run scripted stage playtest coverage across Verdant Impact Crater, Ember Rift Warrens, and Halo Spire Array to confirm terrain and gravity rollout, retry safety, and checkpoint placement
- [x] 4.3 Verify in mixed encounters that player and enemy defeat effects remain local, readable, and consistent with the bounded retro presentation rules