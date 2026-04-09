## ADDED Requirements

### Requirement: The game supports additional enemy roles with distinct spatial pressure
The game SHALL support enemy archetypes beyond the MVP set when expanding encounters, including roles that pressure charge lanes, aerial space, ambush timing, or directional vulnerability. Each added enemy MUST remain readable through clear telegraphing or repeated behavior.

#### Scenario: Encountering a charging enemy
- **WHEN** the player enters a section with a charge-based enemy
- **THEN** the enemy telegraphs its attack before rushing so the player can react

#### Scenario: Encountering an aerial or ambush enemy
- **WHEN** the player enters a section with a flying or drop-triggered enemy
- **THEN** the threat applies a distinct kind of pressure compared with ground patrol enemies

### Requirement: Mixed enemy encounters remain readable
The game SHALL combine threat types intentionally so encounter difficulty comes from overlapping roles rather than visual confusion or unavoidable damage.

#### Scenario: Entering a mixed encounter
- **WHEN** the player reaches a section with multiple enemy types
- **THEN** each threat remains individually readable and the player has a learnable response window

#### Scenario: Repeating a mixed encounter
- **WHEN** the player retries the same encounter
- **THEN** enemy timing and positioning remain consistent enough to support mastery
