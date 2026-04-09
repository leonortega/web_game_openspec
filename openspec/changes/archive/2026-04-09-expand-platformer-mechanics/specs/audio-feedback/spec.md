## ADDED Requirements

### Requirement: Core player and threat events produce sound feedback
The game SHALL play sound effects for major gameplay events so player actions and dangers feel readable and responsive.

#### Scenario: Performing a core movement action
- **WHEN** the player jumps, lands, or takes damage
- **THEN** the game plays an appropriate sound effect for that event

#### Scenario: Resolving a threat interaction
- **WHEN** the player stomps an enemy, is hit by a threat, or a turret fires
- **THEN** the game plays a sound effect that matches the event outcome

### Requirement: Reward and progression events are reinforced by sound
The game SHALL use sound to emphasize collectibles, checkpoints, and completion moments.

#### Scenario: Collecting a reward
- **WHEN** the player collects a crystal or equivalent reward
- **THEN** the game plays a positive pickup sound

#### Scenario: Activating a checkpoint
- **WHEN** the player activates a checkpoint
- **THEN** the game plays a recognizable checkpoint confirmation sound

#### Scenario: Reaching the stage exit
- **WHEN** the player completes a stage
- **THEN** the game plays a completion or transition sound cue

### Requirement: Stages have distinct music identity
The game SHALL provide stage music or ambient music that differentiates major environments.

#### Scenario: Starting a stage
- **WHEN** the player enters a stage
- **THEN** music appropriate to that stage's biome begins playing

#### Scenario: Moving between stages
- **WHEN** the player transitions from one stage to another
- **THEN** the music changes to reflect the new environment

### Requirement: Audio can communicate danger or timing
The game SHALL use sound cues to support readable telegraphs for selected hazards, enemies, or unstable terrain.

#### Scenario: Entering a telegraphed attack pattern
- **WHEN** a threat begins a readable wind-up or timing window
- **THEN** the game may play a warning or charge cue before the dangerous state resolves

#### Scenario: Triggering unstable terrain
- **WHEN** the player activates a collapsing or time-sensitive platform
- **THEN** the game provides sound feedback that the terrain state has changed

### Requirement: Audio behavior remains consistent and non-blocking
The game SHALL apply audio cues consistently without preventing gameplay from remaining understandable if sound is unavailable or muted.

#### Scenario: Repeating the same gameplay action
- **WHEN** the player repeats the same event under the same conditions
- **THEN** the same class of sound feedback is produced consistently

#### Scenario: Playing with audio disabled
- **WHEN** sound is unavailable, muted, or unsupported
- **THEN** the game remains playable through visual and systemic feedback alone
