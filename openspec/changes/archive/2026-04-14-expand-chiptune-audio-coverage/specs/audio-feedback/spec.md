## ADDED Requirements

### Requirement: Menus and transition surfaces provide synthesized audio feedback
The game SHALL use the synthesized audio system for menu navigation and non-gameplay transition surfaces so entry, confirmation, and completion moments feel consistent with gameplay feedback.

#### Scenario: Unlocking menu audio after player interaction
- **WHEN** the main menu is shown before the browser has granted audio playback
- **THEN** the menu remains fully usable without sound
- **AND** the game begins menu music or the next eligible menu cue only after the player performs a qualifying keyboard or pointer interaction

#### Scenario: Navigating menu actions
- **WHEN** the player changes the selected menu option, confirms an action, or backs out of `Help` or `Options` while audio is available
- **THEN** the game plays a distinct synthesized navigation, confirm, or back cue for that action
- **AND** those cues do not prevent the action from completing

#### Scenario: Showing transition celebration surfaces
- **WHEN** the stage intro or stage-clear surface appears while audio is available
- **THEN** the game plays the authored synthesized intro or completion stinger for that surface
- **AND** the stinger does not change the existing scene duration or auto-advance timing

## MODIFIED Requirements

### Requirement: Core player and threat events produce sound feedback
The game SHALL play synthesized sound effects for major gameplay events so player actions, powers, interactive objects, and dangers feel readable and responsive.

#### Scenario: Performing a core movement or power action
- **WHEN** the player jumps, double-jumps, lands, dashes, or fires an equipped attack power
- **THEN** the game plays an appropriate synthesized cue for that action

#### Scenario: Triggering an interactive gameplay object
- **WHEN** the player activates a spring, launcher, collapsing surface, reward block, bounce pod, gas vent, or equivalent authored interactive object that changes movement or state
- **THEN** the game plays a synthesized cue that matches the interaction outcome

#### Scenario: Resolving a threat interaction
- **WHEN** the player stomps an enemy, hits with a projectile, is hit by a threat, or a turret fires
- **THEN** the game plays a synthesized cue that matches the event outcome

#### Scenario: Taking fatal damage
- **WHEN** the player loses the last remaining health and enters the death or respawn sequence
- **THEN** the game plays a dedicated synthesized death cue once for that death event
- **AND** the survivable damage cue is not replayed as the death cue

### Requirement: Reward and progression events are reinforced by sound
The game SHALL use synthesized sound to emphasize research-sample pickups, power acquisition, survey-beacon activation, and completion moments. The fiction rename MUST NOT change which collectible, checkpoint, power, or completion events trigger those cues.

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
The game SHALL provide synthesized stage music that differentiates major environments and coordinates correctly with stage intro and gameplay scene changes.

#### Scenario: Starting a stage
- **WHEN** the player enters a stage intro and then gameplay for a stage
- **THEN** the game plays a short synthesized intro stinger or opening phrase for that stage presentation
- **AND** the stage's gameplay music loop begins once gameplay starts

#### Scenario: Moving between stages
- **WHEN** the player transitions from one stage to another
- **THEN** the prior stage loop stops before the next stage intro or gameplay music begins
- **AND** the new stage music reflects the new environment

### Requirement: Audio behavior remains consistent and non-blocking
The game SHALL apply synthesized audio cues consistently without preventing gameplay or menus from remaining understandable if sound is unavailable, muted, unsupported, or not yet unlocked by the browser.

#### Scenario: Repeating the same gameplay action
- **WHEN** the player repeats the same event under the same conditions
- **THEN** the same class of synthesized feedback is produced consistently

#### Scenario: Playing with audio disabled
- **WHEN** sound is unavailable, muted, or unsupported
- **THEN** the game remains playable through visual and systemic feedback alone

#### Scenario: Entering a scene before audio unlock
- **WHEN** a menu, intro, gameplay, or completion scene appears before the browser allows audio playback
- **THEN** the scene remains fully functional without sound
- **AND** the game does not throw errors or stall scene flow while waiting for audio unlock

#### Scenario: Changing scenes with active music
- **WHEN** the game changes between menu, intro, gameplay, and completion scenes
- **THEN** the outgoing loop or sustained phrase stops or is replaced cleanly
- **AND** the game does not leave multiple scene music loops playing at the same time
