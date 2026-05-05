## ADDED Requirements

### Requirement: Stage-exit capsule presentation stays grounded and distinct from traversal capsules
The game SHALL present the stage-completion exit as a grounded capsule endpoint with readable local footing, base structure, or adjacent support cues rather than as a floating traversal prop. The stage-exit capsule MUST remain visually distinct from gravity capsule sections through silhouette, local base treatment, finish-only state cues, or equivalent bounded presentation differences, and it MUST reserve teleport or dematerialization feedback for valid stage completion only. Once the exit-finish disappearance passes the point where the player is no longer meant to be visible, ordinary multipart player rendering MUST remain suppressed until the normal completion-scene handoff.

#### Scenario: Reading a grounded exit endpoint
- **WHEN** the player approaches the stage-completion capsule during active play
- **THEN** the endpoint reads as a supported grounded exit on the intended route rather than a floating rectangle or generic traversal device

#### Scenario: Comparing the stage exit with a traversal capsule
- **WHEN** the player sees the stage-completion capsule and a gravity capsule section in the same play session
- **THEN** the completion endpoint reads as a separate finish device rather than another traversal capsule

#### Scenario: Watching disappearance finish after hide
- **WHEN** the player has already disappeared during a valid exit-finish sequence
- **THEN** ordinary player-part rendering remains suppressed until the results handoff completes