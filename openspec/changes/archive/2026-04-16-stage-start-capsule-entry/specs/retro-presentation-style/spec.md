## MODIFIED Requirements

### Requirement: Stage-exit capsule presentation stays grounded and distinct from traversal capsules
The game SHALL present the stage-completion exit as a grounded capsule endpoint with readable local footing, base structure, or adjacent support cues rather than as a floating traversal prop. The stage-exit capsule MUST remain visually distinct from gravity capsule sections through silhouette, local base treatment, finish-only state cues, or equivalent bounded presentation differences. Fresh stage entry and automatic next-stage advance MAY present a short mirrored capsule-arrival appearance beat at the player's authored start position, but that beat MUST read as player arrival rather than as a second completion endpoint and MUST remain visually distinct from traversal capsules through its local timing, appearance direction, or equivalent bounded state cues. The completion endpoint MUST reserve disappearance-style teleport or dematerialization feedback for valid stage completion only, while stage-start capsule feedback is limited to bounded appearance or rematerialization presentation before active control begins. Once the exit-finish disappearance passes the point where the player is no longer meant to be visible, ordinary multipart player rendering MUST remain suppressed until the normal completion-scene handoff.

#### Scenario: Reading a grounded exit endpoint
- **WHEN** the player approaches the stage-completion capsule during active play
- **THEN** the endpoint reads as a supported grounded exit on the intended route rather than a floating rectangle or generic traversal device

#### Scenario: Reading a stage-start capsule arrival
- **WHEN** a fresh stage attempt begins or the game auto-advances into a new stage
- **THEN** the player spawn presentation may use a short mirrored capsule-arrival appearance beat at the authored start position
- **AND** the effect stays local and bounded enough that route-critical geometry around the spawn remains readable

#### Scenario: Comparing the stage exit with a traversal capsule
- **WHEN** the player sees the stage-completion capsule and a gravity capsule section in the same play session
- **THEN** the completion endpoint reads as a separate finish device rather than another traversal capsule

#### Scenario: Comparing stage-start arrival with stage completion
- **WHEN** the player sees a stage-start capsule arrival and later completes the same or another stage through the exit capsule
- **THEN** the stage-start beat reads as an arrival or appearance event at spawn
- **AND** the exit capsule still reads as the only valid completion endpoint that owns disappearance-style finish feedback

#### Scenario: Watching disappearance finish after hide
- **WHEN** the player has already disappeared during a valid exit-finish sequence
- **THEN** ordinary player-part rendering remains suppressed until the results handoff completes