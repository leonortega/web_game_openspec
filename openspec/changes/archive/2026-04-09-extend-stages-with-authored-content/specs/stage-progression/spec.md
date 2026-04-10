## MODIFIED Requirements

### Requirement: Main stages sustain at least 20 minutes of first-time play
The game SHALL author each main stage with additional platforms, enemies, blocks, hazards, checkpoints, and optional detours so an average first-time player requires at least 20 minutes to complete it under intended play conditions. The stage duration MUST be achieved through meaningful gameplay content, and it MUST NOT be achieved by scaling the dimensions of existing authored objects or by leaving long empty movement sections.

#### Scenario: First-time stage completion target
- **WHEN** a main stage is playtested by a first-time average player following the intended route
- **THEN** the stage takes at least 20 minutes to complete

#### Scenario: Stage duration is driven by authored content
- **WHEN** stage content is extended to meet the duration target
- **THEN** the added time comes from authored gameplay segments, enemy encounters, blocks, and checkpoints rather than from enlarged platforms or other scaled geometry

### Requirement: Stages are divided into multiple pacing segments
The game SHALL structure each main stage into multiple authored segments with distinct challenge emphasis, recovery beats, or environmental transitions so progression remains readable across the extended route. These segments MUST be built from authored content additions rather than from scaling the existing route layout.

#### Scenario: Progressing through a long stage
- **WHEN** the player advances through a main stage
- **THEN** they encounter multiple recognizable segments instead of a single continuous challenge band

#### Scenario: Recovery after a difficulty spike
- **WHEN** the player completes a high-pressure section
- **THEN** the stage provides a short recovery or reset beat before the next major escalation
