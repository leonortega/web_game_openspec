## MODIFIED Requirements

### Requirement: Transition screens preserve readable player status
The game SHALL show consistent player progression information across stage intro and stage-clear transition screens using the same authored stage display names, astronaut-themed power labels, research-sample collectible terminology, and survey-beacon checkpoint terminology used elsewhere in the run. Under the Atari 2600-inspired presentation pass, these screens MUST use the same coarse silhouette-first, flat-fill, limited-color visual language as gameplay while keeping text and key status values readable. Under the second-pass tightening, these screens MUST adopt harsher palette quantization and tighter sprite-like visual motion limits than the current baseline presentation. Any displayed stage-local and run-total collectible counts on those screens MUST use the same research-sample noun family rather than switching labels between surfaces. These screens MUST keep the player's current readiness and progress readable without implying new mechanics beyond the supported four powers and existing stage flow. Motion on these screens MUST remain sparse and pose-based rather than relying on polished modern panel animation. This presentation tightening MUST NOT change scene ordering, scene duration, or progression timing semantics.

#### Scenario: Viewing a pre-stage screen
- **WHEN** the player sees the stage presentation before gameplay
- **THEN** the screen includes the authored stage identity and current player status using the same research-sample and survey-beacon fiction used during play
- **AND** the presentation uses the retro-inspired flat-fill style without reducing status readability

#### Scenario: Viewing a post-clear screen
- **WHEN** the player sees the stage results screen
- **THEN** the screen includes stage-clear context and current progression totals using the same stage, collectible, checkpoint, and power naming shown during play
- **AND** the screen remains legible within the reduced-palette retro treatment

#### Scenario: Reading transition status during sparse animation
- **WHEN** the transition screen animates between poses or layout states
- **THEN** the player's stage and progression information remains readable without depending on smooth modern panel motion

#### Scenario: Tightening transitions without changing scene flow timing
- **WHEN** the second-pass retro tightening is applied to the intro and completion scenes
- **THEN** the screens render with harsher quantization and sprite-like visual motion limits
- **AND** the existing stage flow order and timing semantics remain unchanged