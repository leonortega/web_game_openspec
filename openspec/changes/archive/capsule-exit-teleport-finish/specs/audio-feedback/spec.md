## MODIFIED Requirements

### Requirement: Reward and progression events are reinforced by sound
The game SHALL use synthesized sound to emphasize research-sample pickups, power acquisition, survey-beacon activation, stage completion, and final-run congratulations. These cues MUST read as positive, authored 8-bit feedback rather than generic copies of one another. The fiction rename MUST NOT change which collectible, checkpoint, power, or completion events trigger those cues. When a stage exit accepts a valid completion overlap, the game MUST play a dedicated synthesized capsule-entry teleport cue at the start of that exit-finish sequence. That cue MUST remain distinct from pickup, power, checkpoint, damage, and results-surface celebration audio, and it MUST NOT block the bounded finish animation, the later stage-clear handoff, or the results-surface stinger.

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
- **WHEN** the player completes a stage by entering a valid exit
- **THEN** the game plays a dedicated capsule-entry teleport cue as the exit-finish sequence starts
- **AND** that cue resolves without preventing the later completion handoff

#### Scenario: Clearing the final stage
- **WHEN** the player reaches the final stage results surface
- **THEN** the game plays a synthesized congratulatory completion cue or music phrase distinct from the normal stage-exit cue