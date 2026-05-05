## MODIFIED Requirements

### Requirement: Player can defeat eligible enemies with boot-thruster propulsion impact
The game SHALL allow the player to defeat eligible non-turret enemies from above only through an active airborne boot-thruster pulse impact rather than passive stomp contact. The player MUST trigger a downward thruster pulse while airborne to open a short impact window. Thruster pulse usage MUST consume bounded airborne fuel and MUST respect a per-pulse cooldown. Airborne thruster fuel MUST refresh on grounded recovery. Falling onto an enemy from above without an active thruster-impact window MUST NOT defeat that enemy.

#### Scenario: Successful thruster-impact defeat
- **WHEN** the player is airborne, triggers a downward thruster pulse, and collides from above with an eligible enemy during the active impact window
- **THEN** that enemy is defeated
- **AND** the player remains in active play with a bounded rebound outcome

#### Scenario: Falling contact without active thruster pulse
- **WHEN** the player collides from above with an eligible enemy without an active thruster-impact window
- **THEN** the enemy is not defeated by that contact

#### Scenario: Exhausted fuel or active cooldown
- **WHEN** the player attempts to trigger another airborne thruster pulse with no remaining pulse fuel or while cooldown is still active
- **THEN** no new pulse is triggered until fuel and cooldown rules permit it

#### Scenario: Grounded fuel refresh
- **WHEN** the player returns to grounded support after airborne traversal
- **THEN** the thruster pulse fuel pool refreshes for the next airborne sequence
