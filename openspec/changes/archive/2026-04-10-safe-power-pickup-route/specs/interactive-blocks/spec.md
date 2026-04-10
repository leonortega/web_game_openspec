## MODIFIED Requirements

### Requirement: Levels can contain authored interactive reward blocks
The game SHALL allow stages to include interactive blocks that are punched from below by the player and award either coins or one of the supported powers. Reward blocks MUST be authored, deterministic, and readable to the player. Coin blocks MAY require multiple punches equal to their configured coin amount, and each punch MUST consume one reward from the block. Reward blocks MUST NOT be authored in the same lane above or overlapping a stompable grounded enemy where that enemy would block the player's upward interaction path, create a progression lock, or force the player's immediate post-pickup route to require enemy damage that clears the newly granted power.

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
- **WHEN** a stage author places a reward block above a stompable grounded enemy in the same lane
- **THEN** validation rejects the placement or requires the block or enemy to move to a safe lane

#### Scenario: Rejecting a forced-hit reward route
- **WHEN** a stage author places a power block so the intended continuation after pickup still requires the player to take enemy damage
- **THEN** validation rejects the placement or requires the block, enemy, or route to move to a safe arrangement

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

### Requirement: Reward reveals fade out after a block punch
The game SHALL show the released coin or power when a reward block is punched for 1 second and then fade it out.

#### Scenario: Showing a coin reveal
- **WHEN** the player punches a coin block
- **THEN** the released coin is shown as a transient visual reveal for 1 second and fades out

#### Scenario: Showing a power reveal
- **WHEN** the player punches a power block
- **THEN** the released power is shown as a transient visual reveal for 1 second and fades out
