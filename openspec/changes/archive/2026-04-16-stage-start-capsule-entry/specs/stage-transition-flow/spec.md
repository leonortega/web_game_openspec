## MODIFIED Requirements

### Requirement: Transition screens preserve readable player status
The game SHALL show consistent player progression information across stage intro and stage-clear transition screens using the same authored stage display names, astronaut-themed power labels, research-sample collectible terminology, and survey-beacon checkpoint terminology used elsewhere in the run. Under the Atari 2600-inspired presentation pass, these screens MUST use the same coarse silhouette-first, flat-fill, limited-color visual language as gameplay while keeping text and key status values readable. Under the second-pass tightening, these screens MUST adopt harsher palette quantization and tighter sprite-like visual motion limits than the current baseline presentation. Any displayed stage-local and run-total collectible counts on those screens MUST use the same research-sample noun family rather than switching labels between surfaces. These screens MUST keep the player's current readiness and progress readable without implying new mechanics beyond the supported four powers and existing stage flow. Motion on these screens MUST remain sparse and pose-based rather than relying on polished modern panel animation. These screens MUST also trigger short synthesized 8-bit intro, stage-clear, and final-congratulations stingers that match the current transition state when audio is available, and those stingers MUST fit within the existing scene timing semantics while handing off cleanly to or from the designated asset-backed menu or stage music. Pre-stage transition flow MAY hand off into a short in-world capsule-arrival appearance beat before active control starts, but that handoff MUST preserve the same stage-status readability, automatic scene flow, and bounded timing semantics. Transition intro and completion cues MUST remain distinct from moment-to-moment gameplay feedback, MUST NOT change scene ordering, scene duration, or progression timing semantics beyond that bounded stage-start appearance step, and MUST NOT leave multiple sustained loops active or require motif-family matching to the downloaded gameplay tracks.

#### Scenario: Viewing a pre-stage screen
- **WHEN** the player sees the stage presentation before gameplay
- **THEN** the screen includes the authored stage identity and current player status using the same research-sample and survey-beacon fiction used during play
- **AND** the presentation uses the retro-inspired flat-fill style without reducing status readability
- **AND** a short synthesized intro stinger for that specific stage plays when audio is available and hands off cleanly once the in-world arrival beat resolves and gameplay begins

#### Scenario: Handing off from the pre-stage screen into gameplay
- **WHEN** the pre-stage transition surface finishes its bounded presentation
- **THEN** the game may hand off into a short in-world capsule-arrival appearance beat before player control starts
- **AND** the handoff remains automatic and does not require extra player input or hide current stage-status context

#### Scenario: Viewing a post-clear screen
- **WHEN** the player sees the stage results screen
- **THEN** the screen includes stage-clear context and current progression totals using the same stage, collectible, checkpoint, and power naming shown during play
- **AND** the screen remains legible within the reduced-palette retro treatment
- **AND** a synthesized stage-clear cue plays when audio is available without leaving the prior gameplay loop active underneath it

#### Scenario: Reading transition status during sparse animation
- **WHEN** the transition screen animates between poses or layout states
- **THEN** the player's stage and progression information remains readable without depending on smooth modern panel motion

#### Scenario: Tightening transitions without changing scene flow timing
- **WHEN** the second-pass retro tightening is applied to the intro and completion scenes
- **THEN** the screens render with harsher quantization and sprite-like visual motion limits
- **AND** the existing stage flow order and timing semantics remain unchanged apart from an optional bounded stage-start arrival beat after the intro surface
- **AND** transition audio cues do not extend durations or require additional player input before the next scene handoff

#### Scenario: Reaching the final congratulations surface
- **WHEN** the player reaches the final stage results surface after completing the run
- **THEN** the transition surface plays a recognizable synthesized congratulations cue distinct from the normal stage-clear cue
- **AND** the congratulations cue still hands off cleanly without restarting or overlapping another sustained loop