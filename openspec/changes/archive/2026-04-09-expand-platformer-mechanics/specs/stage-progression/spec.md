## ADDED Requirements

### Requirement: Stages include terrain variation that changes pacing
The game SHALL structure stages with meaningful terrain variations such as moving traversal, unstable surfaces, or mobility-assisted routes so progress is shaped by more than static jumps and enemy placement.

#### Scenario: Reaching a terrain-driven segment
- **WHEN** the player enters a segment built around dynamic terrain
- **THEN** the stage pacing shifts through traversal timing, positioning, or movement planning

#### Scenario: Recovering after a terrain challenge
- **WHEN** the player clears a high-pressure terrain section
- **THEN** the stage provides a readable transition or recovery beat before the next escalation

### Requirement: Optional rewards can support progression systems
The game SHALL allow optional stage rewards such as collectibles to contribute to broader progression without making full collection mandatory for stage completion.

#### Scenario: Completing a stage with partial rewards
- **WHEN** the player reaches the exit without collecting every optional item
- **THEN** the stage still completes successfully

#### Scenario: Reaching a progression threshold through rewards
- **WHEN** the player accumulates enough optional rewards for a defined unlock milestone
- **THEN** the game grants the associated progression benefit
