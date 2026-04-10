## MODIFIED Requirements

### Requirement: Powers have clear gameplay rules
The game SHALL communicate ability behavior through consistent input, outcome, and feedback so the player can reliably learn each power. If the player is hurt while one or more active non-invincible powers are present and invincibility is not active, the hit MUST clear those active powers and MUST NOT remove health. If invincibility is active when the player is hurt, the hit MUST preserve invincibility for the remainder of its timer, MUST keep health unchanged for that hit, and MUST still clear any other active non-invincible powers. If the player is hurt with no active powers, the normal health-loss rule MUST still apply. If the player dies, the game MUST clear the active powers before the next respawned attempt.

#### Scenario: Activating a movement power
- **WHEN** the player performs the required input for an authored power
- **THEN** the game triggers the same movement or combat effect consistently

#### Scenario: Attempting an unavailable power
- **WHEN** the player tries to use a power that has not been granted
- **THEN** the game does not grant the effect

#### Scenario: Keeping powers across stages
- **WHEN** the player completes one stage without losing their active powers
- **THEN** those powers remain available in the next stage

#### Scenario: Losing powers instead of health on a non-invincible powered hit
- **WHEN** the player is hurt while at least one active non-invincible power is present and invincibility is not active
- **THEN** the game clears those non-invincible active powers and keeps the current health unchanged

#### Scenario: Retaining invincibility on a protected hit
- **WHEN** the player is hurt while invincibility is active
- **THEN** invincibility remains active until its timer expires and the hit does not remove health

#### Scenario: Clearing other powers while invincible
- **WHEN** the player is hurt while invincibility and another active power are both present
- **THEN** the game preserves invincibility and clears the other active power states for that hit

#### Scenario: Losing health when unpowered
- **WHEN** the player is hurt while no active powers are present
- **THEN** the game applies the normal health-loss rule

#### Scenario: Losing powers after death
- **WHEN** the player dies
- **THEN** the game clears the player's active powers before the next attempt