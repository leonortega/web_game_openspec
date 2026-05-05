# gameplay-hud Specification

## Purpose
Define the active-play HUD layout, terminology, and presentation rules that keep run-critical status readable during gameplay.
## Requirements
### Requirement: Core gameplay HUD information is grouped at the top of the screen
The game SHALL present core gameplay status such as stage identity, collectible count, health, and active powers in a single horizontal top-aligned HUD band during active play. Under the Atari 2600-inspired presentation pass, that HUD band MUST use a scoreboard-like treatment with flat fills, a very small concurrent color vocabulary, strong text contrast, and minimal decorative chrome. Under the second-pass tightening, the HUD MUST use harsher palette quantization and tighter sprite-like visual motion limits than the current baseline, and it MUST NOT rely on smooth easing, translucent card styling, or other modern panel treatments to remain readable. The collectible count in that HUD band MUST present the current progress as research samples and MUST NOT switch to a different collectible noun between stage-local and run-total displays. The primary stage label in that HUD band MUST show only the authored alien-biome stage name and MUST NOT append duration, distance, or similar planning suffixes. When a power is active, the HUD MUST present its astronaut-themed display name rather than an internal mechanic label. Secondary stage metadata such as run label and segment name SHALL appear as tiny bottom-right text instead of inside the primary HUD band. Transient gameplay and stage-message text used during active play MUST render in a separate lower-left safe-area lane that sits close to the bottom-left edge of the play view rather than in the top-center lane above gameplay. That transient lane MUST remain fully on-screen, keep a small bounded inset from the left and bottom edges on standard and narrow or mobile-sized viewports, and MUST stay clear of the primary top-aligned HUD band and any persistent secondary readouts when both are visible. Tightening the HUD presentation MUST NOT change the timing or cadence of gameplay state updates. World-local Beam, flash, shimmer, or distortion accents introduced by gameplay presentation changes MUST NOT warp, blur, or recolor the HUD band, transient message lane, or persistent secondary readouts. Transient active-play copy shown in that lane MUST stay short, fiction-consistent, and immediately useful to the player, and it MUST NOT be used for long authored route summaries, segment-focus labels, or generic combat narration that presentation feedback already covers.

#### Scenario: Reading the HUD over world-local postfx
- **WHEN** enemy palette-ramp effects, player or enemy hit flashes, or localized water or heat distortion are active in the world view
- **THEN** the HUD values and labels remain readable through contrast and layout rather than inheriting those world-local effects
- **AND** the HUD does not warp, shimmer, or flash with the world presentation

#### Scenario: Reading a transient gameplay message during local distortion
- **WHEN** a transient gameplay message appears while a local water or heat shimmer accent is active nearby
- **THEN** the message remains readable in the lower-left safe-area lane
- **AND** the shimmer stays confined to its intended world-local region
