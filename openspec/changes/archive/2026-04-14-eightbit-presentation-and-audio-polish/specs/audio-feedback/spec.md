## MODIFIED Requirements

### Requirement: Motion-heavy sound feedback stays readable and selective
The game SHALL use event-based or cadence-gated synthesized cues for moving threats and moving gameplay objects so motion becomes audible once the source enters the active viewport or another already-supported view-relevant lead-margin, without becoming a constant wall of sound. Continuous movement alone MUST NOT cause unbounded cue spam every frame or simulation tick, and off-screen threat motion MUST remain silent until the threat becomes visible or otherwise immediately relevant to the visible play space. Existing authored lead-margin telegraphs, including the turret exception used to warn of imminent in-view fire, MAY remain audible slightly before full visibility so long as they do not broaden into generic off-screen enemy noise.

#### Scenario: A moving threat enters active view
- **WHEN** an enemy or hazard becomes visible in the active camera view while audio is available
- **THEN** the game may play a synthesized motion, presence, or charge cue for that visible state
- **AND** repeated motion for the same source remains rate-limited by cooldown, cadence, or state-change gating

#### Scenario: A threat remains outside view relevance
- **WHEN** an enemy or hazard is still outside the active view and outside any supported lead-margin telegraph window while audio is available
- **THEN** the game does not repeatedly emit that threat's motion cue

#### Scenario: A turret reaches its supported lead-margin telegraph window
- **WHEN** a turret reaches the existing lead-margin state that warns of imminent in-view fire while audio is available
- **THEN** the game may play the corresponding telegraph or firing cue before the turret is fully visible
- **AND** that exception does not change projectile timing, attack cadence, or broaden to unrelated enemy behaviors

#### Scenario: A moving gameplay object changes state
- **WHEN** a platform, launcher, shuttle, or other moving gameplay object starts moving, reverses, locks, releases, or resolves an interaction state while audio is available
- **THEN** the game plays a synthesized cue that matches that motion change
- **AND** the cue does not repeat continuously while the object remains in the same steady movement state