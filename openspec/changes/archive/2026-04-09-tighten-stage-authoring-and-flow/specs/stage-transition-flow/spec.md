## ADDED Requirements

### Requirement: Stages present a brief status screen before gameplay begins
The game SHALL show a short pre-stage presentation screen before active gameplay starts. The presentation MUST identify the stage and summarize current player status such as crystals recovered, health, and unlocked power state before transitioning into the stage automatically.

#### Scenario: Starting a stage from menu
- **WHEN** the player starts an unlocked stage
- **THEN** a pre-stage presentation screen appears before gameplay begins

#### Scenario: Presentation timeout completes
- **WHEN** the pre-stage presentation has been visible for its configured short duration
- **THEN** the game transitions into active gameplay automatically

### Requirement: Stage completion shows a results screen before continuing
The game SHALL show a stage results screen after a stage is cleared. The results screen MUST summarize current player progression and then continue automatically to the next stage when a next stage exists.

#### Scenario: Clearing a non-final stage
- **WHEN** the player clears a stage that is not the last stage
- **THEN** the game shows the results screen and then advances automatically to the next stage flow

#### Scenario: Clearing the final stage
- **WHEN** the player clears the final stage
- **THEN** the game shows the results screen without attempting to advance to a nonexistent next stage

### Requirement: Transition screens preserve readable player status
The game SHALL show consistent player progression information across stage intro and stage-clear transition screens so the player can understand current readiness and progress without entering menus.

#### Scenario: Viewing a pre-stage screen
- **WHEN** the player sees the stage presentation before gameplay
- **THEN** the screen includes stage identity and current player status

#### Scenario: Viewing a post-clear screen
- **WHEN** the player sees the stage results screen
- **THEN** the screen includes stage-clear context and current progression totals
