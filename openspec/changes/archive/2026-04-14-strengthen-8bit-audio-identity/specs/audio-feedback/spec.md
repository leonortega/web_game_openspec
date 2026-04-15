## ADDED Requirements

### Requirement: Motion-heavy sound feedback stays readable and selective
The game SHALL use event-based or cadence-gated synthesized cues for moving threats and moving gameplay objects so motion is audible without becoming a constant wall of sound. Continuous movement alone MUST NOT cause unbounded cue spam every frame or simulation tick.

#### Scenario: A moving threat enters an active movement or attack cadence
- **WHEN** an enemy or hazard begins a notable movement beat, wind-up, patrol turn, travel burst, or comparable authored motion state while audio is available
- **THEN** the game may play a synthesized motion or charge cue for that state
- **AND** repeated motion for the same source is rate-limited by cooldown, cadence, or state-change gating

#### Scenario: A moving gameplay object changes state
- **WHEN** a platform, launcher, shuttle, or other moving gameplay object starts moving, reverses, locks, releases, or resolves an interaction state while audio is available
- **THEN** the game plays a synthesized cue that matches that motion change
- **AND** the cue does not repeat continuously while the object remains in the same steady movement state

### Requirement: Audio validation proves recognizable 8-bit differentiation
The game SHALL validate not only that music and sound cues trigger, but also that major audio surfaces are recognizably differentiated within the same 8-bit synthesized style. Menu, stage gameplay, danger, reward, death, stage-clear, and final-congratulations audio MUST NOT collapse into interchangeable placeholder beeps.

#### Scenario: Comparing major audio surfaces during validation
- **WHEN** automated coverage and playtest validation review menu, gameplay, danger, reward, death, and completion audio for a build
- **THEN** the validation proves each surface has a recognizable synthesized 8-bit cue or motif family distinct from the others

## MODIFIED Requirements

### Requirement: Core player and threat events produce sound feedback
The game SHALL play synthesized sound effects for major gameplay events so player actions, powers, interactive objects, moving gameplay objects, and threats feel readable, responsive, and intentionally authored in a recognizable 8-bit style.

#### Scenario: Performing a core movement or power action
- **WHEN** the player jumps, double-jumps, lands, dashes, or fires an equipped attack power
- **THEN** the game plays an appropriate synthesized cue for that action
- **AND** those action cues remain audibly distinct from damage, reward, and menu feedback

#### Scenario: Triggering an interactive gameplay object
- **WHEN** the player activates a spring, launcher, collapsing surface, reward block, bounce pod, gas vent, or equivalent authored interactive object that changes movement or state
- **THEN** the game plays a synthesized cue that matches the interaction outcome

#### Scenario: Resolving a threat interaction
- **WHEN** the player stomps an enemy, hits with a projectile, is hit by a threat, or a turret fires
- **THEN** the game plays a synthesized cue that matches the event outcome

#### Scenario: Hearing moving threats and moving objects
- **WHEN** an enemy, hazard, platform, or comparable gameplay object enters an authored movement or attack state that players need to read
- **THEN** the game provides a recognizable synthesized motion, charge, or actuation cue for that state without requiring constant uninterrupted playback

#### Scenario: Taking fatal damage
- **WHEN** the player loses the last remaining health and enters the death or respawn sequence
- **THEN** the game plays a dedicated synthesized death cue once for that death event
- **AND** the survivable damage cue is not replayed as the death cue

### Requirement: Reward and progression events are reinforced by sound
The game SHALL use synthesized sound to emphasize research-sample pickups, power acquisition, survey-beacon activation, stage completion, and final-run congratulations. These cues MUST read as positive, authored 8-bit feedback rather than generic copies of one another. The fiction rename MUST NOT change which collectible, checkpoint, power, or completion events trigger those cues.

#### Scenario: Collecting a reward
- **WHEN** the player collects a research sample or equivalent reward pickup
- **THEN** the game plays a positive pickup cue

#### Scenario: Revealing or taking a power reward
- **WHEN** the player reveals a power reward block or gains a power from a gameplay reward source
- **THEN** the game plays a recognizable positive power cue distinct from basic sample pickup feedback

#### Scenario: Activating a checkpoint
- **WHEN** the player activates a survey beacon
- **THEN** the game plays a recognizable checkpoint confirmation cue

#### Scenario: Reaching the stage exit
- **WHEN** the player completes a stage
- **THEN** the game plays a stage-completion transition cue before gameplay hands off to the results surface

#### Scenario: Clearing the final stage
- **WHEN** the player reaches the final stage results surface
- **THEN** the game plays a synthesized congratulatory completion cue or music phrase distinct from the normal stage-exit cue

### Requirement: Stages have distinct music identity
The game SHALL provide clearly retro 8-bit styled synthesized music that differentiates the menu and each authored playable stage, and it SHALL coordinate that music correctly with stage intro, gameplay, and completion scene changes. A practical interpretation of distinct identity is required: each playable stage MUST have its own recognizable gameplay loop or motif and its own opening phrase family, even if the same synthesis system and instrument palette are reused across the game.

#### Scenario: Starting the menu and a stage
- **WHEN** the player unlocks audio on the main menu and later enters a stage intro and gameplay for a stage
- **THEN** the game plays a recognizable menu theme on the menu surface
- **AND** the stage presentation plays a short synthesized intro stinger or opening phrase for that specific stage
- **AND** the stage's gameplay music loop begins once gameplay starts

#### Scenario: Moving between stages
- **WHEN** the player transitions from one stage to another
- **THEN** the prior stage loop stops before the next stage intro or gameplay music begins
- **AND** the new stage music reflects the new stage rather than replaying the previous stage motif unchanged

#### Scenario: Comparing stage themes
- **WHEN** a reviewer compares the gameplay music for two different playable stages
- **THEN** each stage presents a recognizable difference in melody, rhythm, phrase contour, or equivalent musical identity within the shared 8-bit style