## MODIFIED Requirements

### Requirement: Stages include terrain variation that changes pacing
The game SHALL structure stages with meaningful platform variation such as moving traversal, unstable surfaces, full-platform brittle or sticky variants, spring traversal, reveal-platform routes, scanner-switch temporary bridges, activation-node magnetic platforms, or bounded gravity-field traversal so progress is shaped by more than static jumps and enemy placement. For qualifying empty-platform traversal sections, stage progression authoring MUST distribute mechanic families across early, middle, and late route segments so variety ramps over time instead of clustering in a single stage slice. A qualifying stage MUST NOT satisfy this requirement by using only jump-related beats in every empty-platform section.

#### Scenario: Reaching a terrain-driven segment
- **WHEN** the player enters a segment built around dynamic or variant-driven platforms
- **THEN** the stage pacing shifts through traversal timing, positioning, or movement planning

#### Scenario: Recovering after a terrain challenge
- **WHEN** the player clears a high-pressure platform-variation section
- **THEN** the stage provides a readable transition or recovery beat before the next escalation

#### Scenario: Reviewing empty-platform variety distribution
- **WHEN** authored stage validation checks qualifying empty-platform traversal sections across early, middle, and late stage segments
- **THEN** validation confirms mechanic-family variety is distributed across progression segments instead of concentrated in one segment only

#### Scenario: Rejecting jump-only empty-platform progression
- **WHEN** qualifying empty-platform traversal sections across a stage are authored as jump-only beats without broader mechanic families
- **THEN** validation rejects the stage authoring before runtime use
