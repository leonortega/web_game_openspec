## MODIFIED Requirements

### Requirement: Transition surfaces use bounded retro pose and accent animation
The game SHALL present stage intro and completion surfaces with sparse retro motion that reinforces the current transition state without changing flow semantics. These surfaces MAY animate stage, backdrop, text, or celebration accents, but they MUST NOT render a decorative astronaut or other player-figure accent on the intro or completion layout. Any remaining accent motion on those layouts MUST stay non-figurative and MUST NOT imply a helmeted astronaut, player idle pose, or other character-like silhouette even in abstracted form. Any remaining motion MUST stay subordinate to readable stage and progression text, MUST fit inside the existing scene durations, and MUST hand off cleanly with the current audio timing.

#### Scenario: Viewing a pre-stage transition surface
- **WHEN** the player sees a stage intro surface before gameplay begins
- **THEN** the screen may animate through a bounded stage or accent loop that reinforces the stage identity and player readiness
- **AND** the layout does not include a decorative astronaut or player-figure accent
- **AND** any intro accent remains abstract and non-character-like
- **AND** the animation remains sparse enough that the stage and progression information stays readable

#### Scenario: Viewing a post-clear transition surface
- **WHEN** the player sees a stage-clear or final-congratulations surface
- **THEN** the screen may play a brief celebratory accent that matches the current completion state
- **AND** the layout does not include a decorative astronaut or player-figure accent
- **AND** the effect resolves within the existing surface duration without extending the scene

#### Scenario: Preserving transition timing and audio handoff
- **WHEN** transition animation plays alongside intro, stage-clear, or final-congratulations audio
- **THEN** the motion remains synchronized with the existing scene timing semantics
- **AND** the animation does not delay, duplicate, or conflict with the clean music or stinger handoff rules