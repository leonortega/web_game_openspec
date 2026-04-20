## MODIFIED Requirements

### Requirement: Stage-exit capsule presentation stays grounded and distinct from traversal capsules
The game SHALL present the stage-completion exit as a grounded capsule endpoint with readable local footing, base structure, or adjacent support cues rather than as a floating traversal prop. The stage-exit capsule MUST remain visually distinct from gravity capsule sections through silhouette, local base treatment, finish-only state cues, or equivalent bounded presentation differences. Fresh stage entry and automatic next-stage advance MAY present a short mirrored capsule-arrival appearance beat at the player's authored start position, and that beat MUST use the same capsule shell and door design as the stage-completion exit. The stage-start presentation MUST reverse the exit-finish disappearance language into an arrival or rematerialization beat, MUST continue into a short automatic player walk-out, and MUST resolve into an inert closed-door prop before active play begins. The completion endpoint MUST reserve disappearance-style teleport or dematerialization feedback for valid stage completion only, while stage-start capsule feedback is limited to bounded appearance or rematerialization presentation plus the scripted walk-out and short post-walk door-close beat before active control begins. The persistent start capsule MUST remain non-interactive after that beat resolves. Even though start and exit share the same capsule design, the start capsule MUST read as arrival-only infrastructure through its fresh-start timing, reversed effect direction, automatic walk-out, and inert closed final state rather than through separate art. Once the exit-finish disappearance passes the point where the player is no longer meant to be visible, ordinary multipart player rendering MUST remain suppressed until the normal completion-scene handoff.

#### Scenario: Reading a grounded exit endpoint
- **WHEN** the player approaches the stage-completion capsule during active play
- **THEN** the endpoint reads as a supported grounded exit on the intended route rather than a floating rectangle or generic traversal device

#### Scenario: Reading a stage-start capsule arrival
- **WHEN** a fresh stage attempt begins or the game auto-advances into a new stage
- **THEN** the player spawn presentation may use a short mirrored capsule-arrival appearance beat at the authored start position with the same capsule design as the exit endpoint
- **AND** the effect stays local and bounded enough that route-critical geometry around the spawn remains readable

#### Scenario: Reading a persistent start capsule after walk-out
- **WHEN** the player gains control after a fresh stage-start arrival resolves
- **THEN** the start capsule remains behind as a grounded inert prop with the same closed capsule design family as the exit endpoint
- **AND** it does not read as a usable exit or traversal capsule during active play

#### Scenario: Comparing the stage exit with a traversal capsule
- **WHEN** the player sees the stage-completion capsule and a gravity capsule section in the same play session
- **THEN** the completion endpoint reads as a separate finish device rather than another traversal capsule

#### Scenario: Comparing stage-start arrival with stage completion
- **WHEN** the player sees a stage-start capsule arrival and later completes the same or another stage through the exit capsule
- **THEN** the stage-start beat reads as an arrival event through reversed effect direction and automatic walk-out rather than as a second completion endpoint
- **AND** the exit capsule still reads as the only valid completion endpoint that owns disappearance-style finish feedback

#### Scenario: Watching disappearance finish after hide
- **WHEN** the player has already disappeared during a valid exit-finish sequence
- **THEN** ordinary player-part rendering remains suppressed until the results handoff completes