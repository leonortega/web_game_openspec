## MODIFIED Requirements

### Requirement: Authored interactives remain on intended routes
The game SHALL place collectibles and other authored interactives only in positions that belong to intended reachable traversal routes or optional authored detours. Punchable interactive blocks MUST leave enough vertical clearance between the floor and the block for the player to reach them from below, and the intended route after collecting any reward from a block MUST remain safely traversable without requiring immediate enemy contact, including contact with non-stompable hazard enemies.

#### Scenario: Spotting an interactive element
- **WHEN** the player sees a collectible or similar authored interactive
- **THEN** there is a valid reachable route to that element within the intended stage flow

#### Scenario: Punching a block from below
- **WHEN** the player jumps upward beneath an interactive block
- **THEN** the block is reachable from below without requiring an impossible jump arc

#### Scenario: Continuing after collecting a coin
- **WHEN** the player collects a coin reward from an authored block
- **THEN** the intended route ahead remains safely traversable without forcing an immediate enemy hit or unavoidable contact with a hazard enemy
