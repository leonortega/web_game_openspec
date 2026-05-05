## MODIFIED Requirements

### Requirement: Levels can contain authored interactive reward blocks
The game SHALL allow stages to include interactive blocks that are punched from below by the player and award either coins or one of the supported powers. Reward blocks MUST be authored, deterministic, and readable to the player. Coin blocks MAY require multiple punches equal to their configured coin amount, and each punch MUST consume one reward from the block. Reward blocks MUST NOT be authored in the same lane above or overlapping a stompable grounded enemy, a non-stompable hazard enemy, or any other blocking enemy configuration where that enemy would block the player's upward interaction path, create a progression lock, or force the player's immediate post-pickup route to require enemy contact that clears the collected reward, including coin rewards and power rewards.

#### Scenario: Punching a coin block
- **WHEN** the player jumps up into an authored block configured to award coins
- **THEN** the game grants one coin reward and decreases the remaining coin count for that block

#### Scenario: Exhausting a multi-coin block
- **WHEN** the player continues punching a coin block with multiple remaining coins
- **THEN** each punch grants one coin until the block is depleted

#### Scenario: Punching a power block
- **WHEN** the player jumps up into an authored block configured to award a power
- **THEN** the game grants the configured power reward

#### Scenario: Rejecting a blocked block placement
- **WHEN** a stage author places a reward block above a stompable grounded enemy or a blocking hazard enemy in the same lane
- **THEN** validation rejects the placement or requires the block, enemy, or route to move to a safe lane

#### Scenario: Rejecting a forced-hit reward route
- **WHEN** a stage author places a coin or power block so the intended continuation after pickup still requires the player to take enemy contact
- **THEN** validation rejects the placement or requires the block, enemy, or route to move to a safe arrangement
