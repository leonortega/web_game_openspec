## MODIFIED Requirements

### Requirement: Levels can contain authored interactive reward blocks
The game SHALL allow stages to include interactive blocks that are punched from below by the player and award either coins or one of the supported powers. Reward blocks MUST be authored, deterministic, and readable to the player. Coin blocks MAY require multiple punches equal to their configured coin amount, each punch MUST consume exactly one coin reward from that block, and each punch MUST show a single coin reveal even when the block contains more than one coin.

#### Scenario: Punching a coin block
- **WHEN** the player jumps up into an authored block configured to award coins
- **THEN** the game grants one coin reward, decreases the remaining coin count for that block, and shows a single coin reveal

#### Scenario: Exhausting a multi-coin block
- **WHEN** the player continues punching a coin block with multiple remaining coins
- **THEN** each punch grants one coin and shows one coin reveal until the block is depleted

#### Scenario: Punching a power block
- **WHEN** the player jumps up into an authored block configured to award a power
- **THEN** the game grants the configured power reward and shows a single power reveal

### Requirement: Reward reveals fade out after a block punch
The game SHALL show the released coin or power when a reward block is punched for 1 second and then fade it out.

#### Scenario: Showing a coin reveal
- **WHEN** the player punches a coin block
- **THEN** the released coin is shown as a transient visual reveal for 1 second and fades out

#### Scenario: Showing a power reveal
- **WHEN** the player punches a power block
- **THEN** the released power is shown as a transient visual reveal for 1 second and fades out
