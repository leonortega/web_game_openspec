## MODIFIED Requirements

### Requirement: Transition surfaces use bounded retro pose and accent animation
The game SHALL present stage intro and completion surfaces with sparse retro motion that reinforces the current transition state without changing flow semantics. These surfaces MAY animate stage, backdrop, text, or celebration accents. The stage intro surface MAY include one bounded astronaut status avatar that reflects the current active power presentation state, and that avatar MUST remain secondary to core status readability. The post-clear completion layout MUST present its existing centered frame, summary card, text content, and bottom instruction strip without a dedicated right-side accent widget. The completion layout MUST NOT leave any widget-only tween, particle burst, or ghost accent motion in the removed right-side widget region. Any remaining accent motion on these layouts MUST stay subordinate to readable stage and progression text, MUST fit inside existing scene durations, and MUST hand off cleanly with current audio timing.

#### Scenario: Viewing a pre-stage transition surface with bounded astronaut status avatar
- **WHEN** the player sees a stage intro surface before gameplay begins
- **THEN** the layout may include one bounded astronaut status avatar that reflects current active power presentation
- **AND** the avatar remains secondary to stage-name and progression readability
- **AND** transition timing semantics remain unchanged

#### Scenario: Viewing a post-clear transition surface without a dedicated side widget
- **WHEN** the player sees a stage-clear or final-congratulations surface
- **THEN** the screen relies on centered frame, summary card, text bands, and completion audio cue without any dedicated right-side accent widget
- **AND** no widget-only tween or particle burst remains in the removed right-side accent region
