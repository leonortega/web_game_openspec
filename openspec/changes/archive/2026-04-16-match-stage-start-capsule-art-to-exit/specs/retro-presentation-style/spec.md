## ADDED Requirements

### Requirement: Stage-start cabin reuses exact stage-exit capsule art treatment
The game SHALL render the fresh stage-start cabin through the same authored shell, door, and grounded base art treatment used by the stage-completion exit capsule rather than through separate start-only rectangle pieces or a near-match approximation. This exact art reuse MUST still leave the stage-start cabin readable as arrival-only infrastructure through its reversed arrival effect direction, fixed grounded placement, automatic walk-out, inert closed final state, and non-interactive behavior instead of through distinct art.

#### Scenario: Comparing start-cabin and exit-capsule art
- **WHEN** the player sees a fresh stage-start cabin and the stage-completion exit capsule in the same play session
- **THEN** both use the same authored capsule art treatment
- **AND** the start cabin no longer renders as a separate simplified rectangle-based variant

#### Scenario: Distinguishing identical art through behavior
- **WHEN** the player observes the start cabin after control begins and later reaches the exit capsule
- **THEN** the start cabin still reads as an inert arrival-only prop through its timing and state
- **AND** the exit capsule remains the only endpoint that owns valid completion disappearance behavior