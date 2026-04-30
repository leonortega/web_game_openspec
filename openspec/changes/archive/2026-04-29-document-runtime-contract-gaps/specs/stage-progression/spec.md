## MODIFIED Requirements

### Requirement: Stages have a clear start-to-exit completion flow
The game SHALL organize play into discrete stages with a defined start position, traversable route, intermediate gameplay segments, and completion exit. A stage MUST begin with a short pre-play presentation step followed by a short bounded in-world capsule-arrival appearance beat before active control starts. That bounded stage-start beat MUST resolve through deterministic ordered phases: rematerialize, scripted walk-out, and door-close, each with stable authored short-duration timing. Active control MUST begin only after that phase sequence resolves. Completion MUST flow through a readable in-world capsule-entry finish before continuing into the stage-clear results step. During completion handoff, the runtime MUST distinguish valid active-state exit contact (`exitReached`) from final completion handoff so one valid exit contact starts the bounded finish sequence first, and final stage completion only resolves after that sequence handoff.

#### Scenario: Entering active play after stage-start phases
- **WHEN** a fresh stage attempt begins
- **THEN** the stage-start sequence runs rematerialize, scripted walk-out, and door-close in order before active control begins

#### Scenario: Touching a valid exit before completion handoff
- **WHEN** the player reaches the exit in a valid active state
- **THEN** runtime marks the exit-contact state first and starts the bounded finish sequence
- **AND** final completion handoff occurs only after that finish sequence resolves