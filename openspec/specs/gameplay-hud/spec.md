# gameplay-hud Specification

## Purpose
Define the active-play HUD layout, terminology, and presentation rules that keep run-critical status readable during gameplay.
## Requirements
### Requirement: Core gameplay HUD information is grouped at the top of the screen
The game SHALL present core gameplay status such as stage identity, collectible count, health, and active powers in a single horizontal top-aligned HUD band during active play. Under the Atari 2600-inspired presentation pass, that HUD band MUST use a scoreboard-like treatment with flat fills, a very small concurrent color vocabulary, strong text contrast, and minimal decorative chrome. Under the second-pass tightening, the HUD MUST use harsher palette quantization and tighter sprite-like visual motion limits than the current baseline, and it MUST NOT rely on smooth easing, translucent card styling, or other modern panel treatments to remain readable. The collectible count in that HUD band MUST present the current progress as research samples and MUST NOT switch to a different collectible noun between stage-local and run-total displays. The primary stage label in that HUD band MUST show only the authored alien-biome stage name and MUST NOT append duration, distance, or similar planning suffixes. When a power is active, the HUD MUST present its astronaut-themed display name rather than an internal mechanic label. Secondary stage metadata such as run label and segment name SHALL appear as tiny bottom-right text instead of inside the primary HUD band. Transient gameplay and stage-message text used during active play MUST render in a separate lower-left safe-area lane that sits close to the bottom-left edge of the play view rather than in the top-center lane above gameplay. That transient lane MUST remain fully on-screen, keep a small bounded inset from the left and bottom edges on standard and narrow or mobile-sized viewports, and MUST stay clear of the primary top-aligned HUD band and any persistent secondary readouts when both are visible. Tightening the HUD presentation MUST NOT change the timing or cadence of gameplay state updates. Transient active-play copy shown in that lane MUST stay short, fiction-consistent, and immediately useful to the player, and it MUST NOT be used for long authored route summaries, segment-focus labels, or generic combat narration that presentation feedback already covers.

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

#### Scenario: Reading a transient gameplay message
- **WHEN** the game shows a stage or gameplay event message during active play
- **THEN** that transient message appears in the lower-left safe-area lane close to the bottom-left edge instead of top-center
- **AND** it remains visually separate from the primary top HUD band and persistent readouts

#### Scenario: Reading transient copy on a narrow viewport
- **WHEN** transient gameplay copy appears during active play on a narrow or mobile-sized viewport
- **THEN** the message remains fully on-screen in the lower-left safe area near the bottom-left edge
- **AND** the top scoreboard HUD band and persistent readouts stay readable at the same time

#### Scenario: Ignoring debug-style copy during active play
- **WHEN** a stage transition, damage event, or enemy defeat occurs during active play
- **THEN** the transient message lane shows only short player-useful copy when needed
- **AND** it does not surface long route-summary text, segment-focus labels, or generic hit or defeat narration

#### Scenario: Reading secondary stage metadata
- **WHEN** the player wants run or segment context
- **THEN** the tiny bottom-right text provides that information without adding a second large HUD block

#### Scenario: Tightening HUD motion without changing update behavior
- **WHEN** the second-pass retro tightening updates the HUD treatment
- **THEN** any visual motion remains sprite-like and restrained
- **AND** the underlying gameplay status values continue updating on the same cadence as before

