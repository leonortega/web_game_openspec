## ADDED Requirements

### Requirement: Levels can contain authored interactive reward blocks
The game SHALL allow stages to include interactive blocks that award either coins or one of the supported powers. Reward blocks MUST be authored, deterministic, and readable to the player.

#### Scenario: Hitting a coin block
- **WHEN** the player interacts with an authored block configured to award coins
- **THEN** the game grants the configured coin reward

#### Scenario: Hitting a power block
- **WHEN** the player interacts with an authored block configured to award a power
- **THEN** the game grants the configured power reward

### Requirement: Power blocks grant only the supported fixed powers
The game SHALL support exactly four authored powers from interactive blocks: double jump, shooter, invincible for 10 seconds, and dash. A power block MUST grant one of those fixed powers and MUST not randomize outside that set.

#### Scenario: Granting double jump
- **WHEN** the player activates a block authored for double jump
- **THEN** the player receives the double jump power

#### Scenario: Granting shooter
- **WHEN** the player activates a block authored for shooter
- **THEN** the player receives the shooter power

#### Scenario: Granting invincibility
- **WHEN** the player activates a block authored for temporary invincibility
- **THEN** the player becomes invincible for 10 seconds

#### Scenario: Granting dash
- **WHEN** the player activates a block authored for dash
- **THEN** the player receives the dash power
