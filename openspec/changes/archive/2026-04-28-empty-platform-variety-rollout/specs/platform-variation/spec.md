## MODIFIED Requirements

### Requirement: Stages support dynamic platform behaviors
The game SHALL support authored platform behaviors beyond static ground so stages can introduce movement-based traversal challenges. Dynamic traversal support MUST include moving platforms, unstable or collapsing support, and full-platform terrain variants such as brittle crystal platforms and sticky sludge platforms. Brittle crystal and sticky sludge MUST no longer be authored as separate partial terrain-overlay rectangles. Each supported behavior MUST follow predictable rules that players can learn through repetition. Empty-platform sections MUST use a broad mechanic mix and MUST NOT rely only on jump-timing beats over plain static support. For each authored empty-platform run that is marked as a traversal challenge segment, stage data MUST include at least two distinct platform-mechanic families from this supported set: moving, unstable or collapsing, spring traversal, sticky, brittle, reveal-platform, scanner-switch temporary bridge, activation-node magnetic platform, or bounded gravity-field traversal.

#### Scenario: Encountering a moving platform
- **WHEN** the player reaches a section with a moving platform
- **THEN** the platform follows its authored path and timing consistently

#### Scenario: Repeating a traversal section
- **WHEN** the player retries the same dynamic platform section
- **THEN** the platform or full-platform variant behavior remains readable and consistent with prior attempts

#### Scenario: Entering a brittle platform section
- **WHEN** the player first steps onto an authored brittle crystal platform from above
- **THEN** that full platform begins its readable brittle-warning state using the authored brittle-platform rules

#### Scenario: Entering a sticky platform section
- **WHEN** the player moves across an authored sticky sludge platform
- **THEN** the traversal section uses the authored sticky-platform movement rules consistently across retries

#### Scenario: Authoring an empty-platform run with only jump timing
- **WHEN** stage data defines a qualifying empty-platform traversal challenge run that uses only plain static jump timing without another supported mechanic family
- **THEN** authored validation rejects that run before runtime use

#### Scenario: Authoring an empty-platform run with mixed mechanics
- **WHEN** stage data defines a qualifying empty-platform traversal challenge run with at least two distinct supported mechanic families
- **THEN** authored validation accepts that run as meeting dynamic-platform variety requirements
