## MODIFIED Requirements

### Requirement: Transition surfaces use bounded retro pose and accent animation
The game SHALL present stage intro and completion surfaces with sparse retro motion that reinforces the current transition state without changing flow semantics. These surfaces MAY animate stage, backdrop, text, or celebration accents, and the stage intro surface MAY also omit a dedicated accent entirely when stage identity and player status remain readable. These surfaces MUST NOT render a decorative astronaut or other player-figure accent on the intro or completion layout. Any remaining accent motion on those layouts MUST stay non-figurative and MUST NOT imply a helmeted astronaut, player idle pose, or other character-like silhouette even in abstracted form. Any remaining motion MUST stay subordinate to readable stage and progression text, MUST fit inside the existing scene durations, and MUST hand off cleanly with the current audio timing.

#### Scenario: Viewing a pre-stage transition surface without a decorative accent
- **WHEN** the player sees a stage intro surface before gameplay begins
- **THEN** the screen may present stage identity and player readiness without any dedicated intro accent motion
- **AND** the layout does not include a decorative astronaut or player-figure accent
- **AND** stage and progression information remains readable within the existing scene duration and timing semantics

#### Scenario: Viewing a pre-stage transition surface with bounded abstract motion
- **WHEN** the player sees a stage intro surface before gameplay begins and the layout includes bounded motion
- **THEN** the motion reinforces the stage identity and player readiness without requiring a separate right-side accent treatment
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