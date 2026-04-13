## MODIFIED Requirements

### Requirement: Transition screens preserve readable player status
The game SHALL show consistent player progression information across stage intro and stage-clear transition screens using the same authored stage display names, astronaut-themed power labels, and biome presentation framing used elsewhere in the run. These screens MUST keep the player's current readiness and progress readable without implying new mechanics beyond the supported four powers and existing stage flow.

#### Scenario: Viewing a pre-stage screen
- **WHEN** the player sees the stage presentation before gameplay
- **THEN** the screen includes the authored stage identity and the current player status using the astronaut-themed presentation

#### Scenario: Viewing a post-clear screen
- **WHEN** the player sees the stage results screen
- **THEN** the screen includes stage-clear context and current progression totals using the same stage and power naming shown during play