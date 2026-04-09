# platform-variation Specification

## Purpose
Define dynamic terrain and platform behaviors that expand traversal variety while preserving readable platformer rules.

## Requirements
### Requirement: Stages support dynamic platform behaviors
The game SHALL support authored platform behaviors beyond static ground so stages can introduce movement-based traversal challenges. Dynamic platforms MUST follow predictable rules that players can learn through repetition.

#### Scenario: Encountering a moving platform
- **WHEN** the player reaches a section with a moving platform
- **THEN** the platform follows its authored path and timing consistently

#### Scenario: Repeating a traversal section
- **WHEN** the player retries the same dynamic platform section
- **THEN** the platform behavior remains readable and consistent with prior attempts

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

### Requirement: Traversal platforms can modify jump flow
The game SHALL support special traversal surfaces such as spring or lift-style platforms that alter player movement in intentional ways.

#### Scenario: Using a spring platform
- **WHEN** the player lands on a spring-like platform
- **THEN** the platform boosts the player with a stronger vertical launch than a normal jump

#### Scenario: Using a lift platform
- **WHEN** the player rides a lift or vertically moving platform
- **THEN** it carries the player along its authored route without breaking traversal readability

### Requirement: Platform variation reinforces stage identity
The game SHALL use platform behaviors to strengthen biome or stage identity rather than applying the same terrain gimmick uniformly everywhere.

#### Scenario: Entering a biome-specific traversal section
- **WHEN** the player reaches a major stage segment
- **THEN** the terrain behavior reflects that stage's environment and pacing focus

#### Scenario: Progressing across multiple stages
- **WHEN** the player compares different stages
- **THEN** each stage presents distinct traversal behavior rather than only palette changes

### Requirement: Moving platforms support stable grounded traversal
The game SHALL allow the player to remain grounded on a moving platform and be carried by its motion without unnatural rejection or forced sliding during normal traversal.

#### Scenario: Standing still on a moving platform
- **WHEN** the player remains idle on a moving platform
- **THEN** the platform carries the player smoothly along its path

#### Scenario: Walking on a moving platform
- **WHEN** the player moves while standing on a moving platform
- **THEN** their movement remains controllable and does not eject them from the platform due to support motion alone

#### Scenario: Jumping from a moving platform
- **WHEN** the player jumps from a moving platform
- **THEN** the jump begins from a stable grounded state rather than a collision rejection state
