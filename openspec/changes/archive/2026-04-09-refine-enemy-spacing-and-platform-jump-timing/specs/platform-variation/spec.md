## MODIFIED Requirements

### Requirement: Unstable platforms create timing pressure
The game SHALL support unstable or collapsing platforms that remain usable briefly before falling or becoming unsafe. A falling platform MUST continue to act as valid support for grounded movement and jump initiation while the player still has top-surface contact with it.

#### Scenario: Standing on a collapsing platform
- **WHEN** the player lands on an unstable platform
- **THEN** the platform gives a short readable warning before dropping or failing

#### Scenario: Leaving a collapsing platform early
- **WHEN** the player exits the unstable platform before it fails
- **THEN** the player can continue traversal if they moved in time

#### Scenario: Jumping during platform descent
- **WHEN** the platform has started falling but the player is still standing on its top surface
- **THEN** the player can still jump normally from that platform
