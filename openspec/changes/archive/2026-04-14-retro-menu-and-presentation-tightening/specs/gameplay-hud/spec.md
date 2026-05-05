## MODIFIED Requirements

### Requirement: Core gameplay HUD information is grouped at the top of the screen
The game SHALL present core gameplay status such as stage identity, collectible count, health, and active powers in a single horizontal top-aligned HUD band during active play. Under the Atari 2600-inspired presentation pass, that HUD band MUST use a scoreboard-like treatment with flat fills, a very small concurrent color vocabulary, strong text contrast, and minimal decorative chrome. Under the second-pass tightening, the HUD MUST use harsher palette quantization and tighter sprite-like visual motion limits than the current baseline, and it MUST NOT rely on smooth easing, translucent card styling, or other modern panel treatments to remain readable. The collectible count in that HUD band MUST present the current progress as research samples and MUST NOT switch to a different collectible noun between stage-local and run-total displays. The primary stage label in that HUD band MUST show only the authored alien-biome stage name and MUST NOT append duration, distance, or similar planning suffixes. When a power is active, the HUD MUST present its astronaut-themed display name rather than an internal mechanic label. Secondary stage metadata such as run label and segment name SHALL appear as tiny bottom-right text instead of inside the primary HUD band. Tightening the HUD presentation MUST NOT change the timing or cadence of gameplay state updates.

#### Scenario: Starting a stage
- **WHEN** the player enters active gameplay
- **THEN** the core gameplay HUD appears at the top of the screen as one grouped horizontal scoreboard-like interface

#### Scenario: Reading the collectible total
- **WHEN** the player reads collectible progress during active play
- **THEN** the HUD labels that progress as research samples using the retro-styled scoreboard treatment

#### Scenario: Reading the stage label
- **WHEN** the player reads the primary HUD stage label during active play
- **THEN** the label shows only the authored stage name without a duration or distance suffix

#### Scenario: Reading the active power label
- **WHEN** the player has one of the supported powers active
- **THEN** the HUD shows the astronaut-themed power display name for that power in a form that remains readable against the flatter presentation

#### Scenario: Reading the HUD over a busy stage backdrop
- **WHEN** the player views the HUD over gameplay action and simplified stage graphics
- **THEN** the HUD values remain readable through contrast and layout rather than gradient-heavy panel effects

#### Scenario: Reading secondary stage metadata
- **WHEN** the player wants run or segment context
- **THEN** the tiny bottom-right text provides that information without adding a second large HUD block

#### Scenario: Tightening HUD motion without changing update behavior
- **WHEN** the second-pass retro tightening updates the HUD treatment
- **THEN** any visual motion remains sprite-like and restrained
- **AND** the underlying gameplay status values continue updating on the same cadence as before